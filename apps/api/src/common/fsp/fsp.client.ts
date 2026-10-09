import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type { FspAchievement } from "@hh/contracts";

// Реестр зовём на каждого кандидата подборки: зависший ответ не должен её держать.
const timeoutMs = 2000;
// История достижений меняется редко: час кэша снимает повторные запросы
// при каждой загрузке подборки и каждом «не подходит».
const cacheTtlSeconds = 60 * 60;

type ParticipantResponse = {
  achievements?: { title?: unknown; year?: unknown; place?: unknown }[];
};

// Реестр ФСП. Пока это apps/mock: GET /participants/:fspId.
@Injectable()
export class FspClient implements OnModuleDestroy {
  private readonly logger = new Logger(FspClient.name);
  private readonly baseUrl: string;
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("FSP_URL") ?? "http://localhost:3001";
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
    if (!fspId) {
      return [];
    }
    const cached = await this.readCache(fspId);
    if (cached) {
      return cached;
    }
    const fresh = await this.fetchAchievements(fspId);
    if (!fresh) {
      return [];
    }
    await this.writeCache(fspId, fresh);
    return fresh;
  }

  // null — реестр не ответил. Такой результат не кэшируем, иначе сбой продержится час.
  private async fetchAchievements(
    fspId: string,
  ): Promise<FspAchievement[] | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/participants/${encodeURIComponent(fspId)}`,
        { signal: AbortSignal.timeout(timeoutMs) },
      );
      if (response.status === 404) {
        return [];
      }
      if (!response.ok) {
        return null;
      }
      const body = (await response.json()) as ParticipantResponse;
      return (body.achievements ?? []).flatMap((item) => {
        if (typeof item.title !== "string" || typeof item.year !== "number") {
          return [];
        }
        return [
          {
            title: item.title,
            year: item.year,
            place: typeof item.place === "number" ? item.place : null,
          },
        ];
      });
    } catch (error) {
      this.logger.warn(`Реестр ФСП недоступен: ${String(error)}`);
      return null;
    }
  }

  private async readCache(fspId: string): Promise<FspAchievement[] | null> {
    try {
      const raw = await this.redis.get(cacheKey(fspId));
      return raw ? (JSON.parse(raw) as FspAchievement[]) : null;
    } catch (error) {
      this.logger.warn(`Кэш ФСП недоступен: ${String(error)}`);
      return null;
    }
  }

  private async writeCache(
    fspId: string,
    achievements: FspAchievement[],
  ): Promise<void> {
    try {
      await this.redis.set(
        cacheKey(fspId),
        JSON.stringify(achievements),
        "EX",
        cacheTtlSeconds,
      );
    } catch (error) {
      this.logger.warn(`Кэш ФСП недоступен: ${String(error)}`);
    }
  }
}

function cacheKey(fspId: string): string {
  return `fsp-achievements:${fspId}`;
}
