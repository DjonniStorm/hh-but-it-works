import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { CandidateSnapshot, HiringNeedInput } from "@hh/contracts";

export type RankResult = {
  candidateId: string;
  score: number;
  reasons: string[];
};

// Дольше не ждём: по таймауту отдаём 503, фронт повторит запрос.
const timeoutMs = 10000;

type RankResponse = {
  results?: { candidateId?: unknown; score?: unknown; reasons?: unknown }[];
};

// Сервис apps/ranking: POST /rank { vacancy, candidates } → { results }.
// Сейчас там заглушка, сам сервис сделают отдельно. Nest только передаёт данные и ждёт оценку.
@Injectable()
export class RankingClient {
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("RANKING_URL") ?? "http://localhost:8000";
  }

  async rank(
    need: HiringNeedInput,
    candidates: CandidateSnapshot[],
  ): Promise<Map<string, RankResult>> {
    let body: RankResponse;
    try {
      const response = await fetch(`${this.baseUrl}/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancy: need, candidates }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      body = (await response.json()) as RankResponse;
    } catch {
      // 503: фронт повторит загрузку, а потом покажет экран ошибки.
      throw new ServiceUnavailableException("Сервис ранжирования недоступен");
    }

    const results = new Map<string, RankResult>();
    for (const item of body.results ?? []) {
      if (typeof item.candidateId !== "string") {
        continue;
      }
      results.set(item.candidateId, {
        candidateId: item.candidateId,
        score: typeof item.score === "number" ? item.score : 0,
        reasons: Array.isArray(item.reasons)
          ? item.reasons.filter((reason): reason is string => {
              return typeof reason === "string";
            })
          : [],
      });
    }
    return results;
  }
}
