import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { Grade } from "@hh/types";

const attemptTtlSeconds = 60 * 60 * 2;

export type StoredAttempt = {
  id: string;
  grade: Grade;
  items: { itemId: string; skillId: string; correctIndex: number }[];
};

@Injectable()
export class AttemptStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: process.env.OPENAPI_EXPORT === "1",
    });
  }

  async save(userId: string, attempt: StoredAttempt): Promise<void> {
    await this.redis.set(
      this.key(userId),
      JSON.stringify(attempt),
      "EX",
      attemptTtlSeconds,
    );
  }

  async take(userId: string): Promise<StoredAttempt | null> {
    const raw = await this.redis.getdel(this.key(userId));
    if (!raw) {
      return null;
    }
    return parseAttempt(raw);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private key(userId: string): string {
    return `assessment:${userId}`;
  }
}

function parseAttempt(raw: string): StoredAttempt | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const attempt = parsed as StoredAttempt;
  if (typeof attempt.id !== "string" || !isGrade(attempt.grade)) {
    return null;
  }
  if (!Array.isArray(attempt.items)) {
    return null;
  }
  return attempt;
}

function isGrade(value: unknown): value is Grade {
  return (
    value === Grade.Junior || value === Grade.Middle || value === Grade.Senior
  );
}
