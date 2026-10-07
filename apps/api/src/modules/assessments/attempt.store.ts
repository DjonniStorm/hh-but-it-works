import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type {
  AttemptAnswer,
  PublicItem,
  SecretItem,
} from "@hh/assessment-engine";
import { isIntegrityFlag } from "@hh/assessment-engine";
import { Grade, IntegrityFlag } from "@hh/types";

const attemptTtlSeconds = 60 * 60 * 2;
// Потолок событий на попытку: клиент не раздует ключ в Redis.
const maxEvents = 50;

export type StoredAttempt = {
  id: string;
  grade: Grade;
  sections: { skillId: string; title: string; count: number }[];
  items: PublicItem[];
  secret: SecretItem[];
  answers: AttemptAnswer[];
  cursor: number;
  // Когда текущий вопрос впервые отдали клиенту. От этого момента идёт его таймер.
  servedAt: number | null;
  startedAt: number;
  ip: string;
  agent: string;
  flags: IntegrityFlag[];
};

@Injectable()
export class AttemptStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: process.env.OPENAPI_EXPORT === "1",
    });
  }

  async create(userId: string, attempt: StoredAttempt): Promise<void> {
    await this.redis.del(this.eventsKey(userId));
    await this.redis.set(
      this.key(userId),
      JSON.stringify(attempt),
      "EX",
      attemptTtlSeconds,
    );
  }

  // Обновление не продлевает попытку: срок считается от старта.
  async update(userId: string, attempt: StoredAttempt): Promise<void> {
    await this.redis.set(this.key(userId), JSON.stringify(attempt), "KEEPTTL");
  }

  async get(userId: string): Promise<StoredAttempt | null> {
    const raw = await this.redis.get(this.key(userId));
    if (!raw) {
      return null;
    }
    return parseAttempt(raw);
  }

  async remove(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  // События идут отдельным списком: ответ и событие могут прийти одновременно.
  async pushEvents(userId: string, flags: IntegrityFlag[]): Promise<number> {
    const key = this.eventsKey(userId);
    const stored = await this.redis.llen(key);
    const accepted = flags.slice(0, Math.max(0, maxEvents - stored));
    if (accepted.length === 0) {
      return 0;
    }
    await this.redis.rpush(key, ...accepted);
    await this.redis.expire(key, attemptTtlSeconds);
    return accepted.length;
  }

  async takeEvents(userId: string): Promise<IntegrityFlag[]> {
    const key = this.eventsKey(userId);
    const raw = await this.redis.lrange(key, 0, -1);
    await this.redis.del(key);
    return raw.filter(isIntegrityFlag);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private key(userId: string): string {
    return `assessment:${userId}`;
  }

  private eventsKey(userId: string): string {
    return `assessment:${userId}:events`;
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
  if (
    !Array.isArray(attempt.items) ||
    !Array.isArray(attempt.secret) ||
    !Array.isArray(attempt.answers) ||
    typeof attempt.cursor !== "number"
  ) {
    return null;
  }
  return attempt;
}

function isGrade(value: unknown): value is Grade {
  return Object.values(Grade).includes(value as Grade);
}
