import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type {
  FspAchievement,
  FspLinkPreview,
  FspParticipant,
} from "@hh/contracts";
import {
  FspAchievementKind,
  FspAchievementLevel,
  FspSportRank,
} from "@hh/types";

// Реестр зовём на каждого кандидата подборки: зависший ответ не должен её держать.
const timeoutMs = 2000;
// История достижений меняется редко: час кэша снимает повторные запросы
// при каждой загрузке подборки и каждом «не подходит».
const cacheTtlSeconds = 60 * 60;

// Ответ реестра без доверия к типам: мок наш, но поля проверяем глазами,
// как и раньше с achievements.
type RawParticipant = {
  fspId?: unknown;
  name?: unknown;
  sportRank?: unknown;
  rating?: unknown;
  achievements?: {
    title?: unknown;
    year?: unknown;
    place?: unknown;
    kind?: unknown;
    level?: unknown;
    organizer?: unknown;
  }[];
};

// Реестр ФСП. Пока это apps/mock: GET /participants/:fspId и /participants/by-email/:email.
@Injectable()
export class FspClient implements OnModuleDestroy {
  private readonly logger = new Logger(FspClient.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("FSP_URL") ?? "http://localhost:3001";
    // Учётные данные клиента OIDC: мок их не проверяет, но формат — как у Keycloak.
    this.clientId = config.get<string>("FSP_CLIENT_ID") ?? "hh";
    this.clientSecret =
      config.get<string>("FSP_CLIENT_SECRET") ?? "hh-mock-secret";
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: process.env.OPENAPI_EXPORT === "1",
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  // Пустая история — обычный ответ, а не ошибка: 404 и недоступный реестр дают [].
  // Подборка не должна падать из-за того, что реестр ФСП лежит.
  async achievements(fspId: string | null): Promise<FspAchievement[]> {
    const participant = await this.participant(fspId);
    return participant?.achievements ?? [];
  }

  // Участник по fspId: null — нет участника, реестр молчит или ответ битый.
  // Такой результат не кэшируем, иначе сбой продержится час.
  async participant(fspId: string | null): Promise<FspParticipant | null> {
    if (!fspId) {
      return null;
    }
    const cached = await this.readCache(`fsp-participant:${fspId}`);
    if (cached) {
      return cached;
    }
    const result = await this.fetchParticipant(
      `/participants/${encodeURIComponent(fspId)}`,
    );
    if (result === "missing" || result === "error") {
      return null;
    }
    await this.writeCache(`fsp-participant:${fspId}`, result);
    return result;
  }

  // Импорт при регистрации: реестр ищет участника по почте.
  // «Не нашли» и «реестр недоступен» различаем: при сбое врать «истории нет» нельзя.
  async findByEmail(email: string): Promise<FspLinkPreview> {
    const cached = await this.readCache(`fsp-by-email:${email}`);
    if (cached) {
      return { status: "found", participant: cached };
    }
    const result = await this.fetchParticipant(
      `/participants/by-email/${encodeURIComponent(email)}`,
    );
    if (result === "missing") {
      return { status: "not-found", participant: null };
    }
    if (result === "error") {
      this.logger.warn(`Реестр ФСП не ответил по почте ${email}`);
      return { status: "unavailable", participant: null };
    }
    await this.writeCache(`fsp-by-email:${email}`, result);
    return { status: "found", participant: result };
  }

  // OIDC-вход: обмен code на sub. Код одноразовый на стороне реестра,
  // поэтому не кэшируем и не переиспользуем.
  async exchangeCode(
    code: string,
  ): Promise<
    | { status: "ok"; sub: string }
    | { status: "invalid" }
    | { status: "unavailable" }
  > {
    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 400) {
        return { status: "invalid" };
      }
      if (!response.ok) {
        return { status: "unavailable" };
      }
      const body = (await response.json()) as { sub?: unknown };
      if (typeof body.sub !== "string" || body.sub === "") {
        this.logger.warn("Реестр ФСП вернул ответ без sub на обмен code");
        return { status: "unavailable" };
      }
      return { status: "ok", sub: body.sub };
    } catch (error) {
      this.logger.warn(
        `Реестр ФСП недоступен при обмене code: ${String(error)}`,
      );
      return { status: "unavailable" };
    }
  }

  // "missing" — в реестре нет, "error" — реестр молчит или прислал битое тело.
  private async fetchParticipant(
    path: string,
  ): Promise<FspParticipant | "missing" | "error"> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 404) {
        return "missing";
      }
      if (!response.ok) {
        return "error";
      }
      const participant = parseParticipant(await response.json());
      return participant ?? "error";
    } catch (error) {
      this.logger.warn(`Реестр ФСП недоступен: ${String(error)}`);
      return "error";
    }
  }

  private async readCache(key: string): Promise<FspParticipant | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) {
        return null;
      }
      // Старый кэш и ручные правки в Redis: не разобрали — просто заново сходим.
      return parseParticipant(JSON.parse(raw));
    } catch (error) {
      this.logger.warn(`Кэш ФСП недоступен: ${String(error)}`);
      return null;
    }
  }

  private async writeCache(key: string, value: unknown): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", cacheTtlSeconds);
    } catch (error) {
      this.logger.warn(`Кэш ФСП недоступен: ${String(error)}`);
    }
  }
}

// Разбор ответа реестра без доверия к типам. Экспортируем для теста,
// как toRankRequest в ranking.client.
export function parseParticipant(raw: unknown): FspParticipant | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const body = raw as RawParticipant;
  if (typeof body.fspId !== "string" || typeof body.name !== "string") {
    return null;
  }
  return {
    fspId: body.fspId,
    name: body.name,
    sportRank: asEnum(body.sportRank, sportRankValues),
    rating: typeof body.rating === "number" ? body.rating : null,
    achievements: (body.achievements ?? []).flatMap(parseAchievement),
  };
}

function parseAchievement(
  item: NonNullable<RawParticipant["achievements"]>[number],
): FspAchievement[] {
  if (typeof item.title !== "string" || typeof item.year !== "number") {
    return [];
  }
  return [
    {
      title: item.title,
      year: item.year,
      place: typeof item.place === "number" ? item.place : null,
      kind:
        asEnum(item.kind, achievementKindValues) ??
        FspAchievementKind.Competition,
      level: asEnum(item.level, achievementLevelValues),
      organizer: typeof item.organizer === "string" ? item.organizer : null,
    },
  ];
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

const achievementKindValues = Object.values(FspAchievementKind);
const achievementLevelValues = Object.values(FspAchievementLevel);
const sportRankValues = Object.values(FspSportRank);
