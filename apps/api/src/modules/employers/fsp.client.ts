import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { FspAchievement } from "@hh/contracts";

// Реестр зовём на каждого кандидата подборки: зависший ответ не должен её держать.
const timeoutMs = 2000;

type ParticipantResponse = {
  achievements?: { title?: unknown; year?: unknown; place?: unknown }[];
};

// Реестр ФСП. Пока это apps/mock: GET /participants/:fspId.
@Injectable()
export class FspClient {
  private readonly logger = new Logger(FspClient.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("FSP_URL") ?? "http://localhost:3001";
  }

  // Пустая история — обычный ответ, а не ошибка: 404 и недоступный реестр дают [].
  // Подборка не должна падать из-за того, что реестр ФСП лежит.
  async achievements(fspId: string | null): Promise<FspAchievement[]> {
    if (!fspId) {
      return [];
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/participants/${encodeURIComponent(fspId)}`,
        { signal: AbortSignal.timeout(timeoutMs) },
      );
      if (!response.ok) {
        return [];
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
      return [];
    }
  }
}
