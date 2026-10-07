import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type {
  AttemptAnswer,
  PublicItem,
  SecretItem,
} from "@hh/assessment-engine";
import { isIntegrityFlag } from "@hh/assessment-engine";
import { Grade, IntegrityFlag, Specialization } from "@hh/types";

import { pushEventsScript, takeScript, updateScript } from "./attempt.scripts";

const attemptTtlSeconds = 60 * 60 * 2;
// Потолок событий на попытку: клиент не раздует ключ в Redis.
const maxEvents = 50;

export type StoredAttempt = {
  id: string;
  grade: Grade;
  // Под какую специализацию собрана попытка: после смены анкеты грейд ей не засчитываем.
  specialization: Specialization;
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
  // false — попытки уже нет или на её месте новая.
  async update(userId: string, attempt: StoredAttempt): Promise<boolean> {
    const written = await this.redis.eval(
      updateScript,
      1,
      this.key(userId),
      attempt.id,
      JSON.stringify(attempt),
    );
    return written === 1;
  }

  async get(userId: string): Promise<StoredAttempt | null> {
    const raw = await this.redis.get(this.key(userId));
    if (!raw) {
      return null;
    }
    return parseAttempt(raw);
  }

  // Атомарно: из двух параллельных finish попытку получит только один.
  async take(
    userId: string,
    attemptId: string,
  ): Promise<{ attempt: StoredAttempt; events: IntegrityFlag[] } | null> {
    const taken = (await this.redis.eval(
      takeScript,
      2,
      this.key(userId),
      this.eventsKey(userId),
      attemptId,
    )) as [string, string[]] | null;
    if (!taken) {
      return null;
    }
    const attempt = parseAttempt(taken[0]);
    if (!attempt) {
      return null;
    }
    return { attempt, events: taken[1].filter(isIntegrityFlag) };
  }

  // События идут отдельным списком: ответ и событие могут прийти одновременно.
  async pushEvents(
    userId: string,
    attemptId: string,
    flags: IntegrityFlag[],
  ): Promise<number> {
    if (flags.length === 0) {
      return 0;
    }
    const accepted = await this.redis.eval(
      pushEventsScript,
      2,
      this.key(userId),
      this.eventsKey(userId),
      attemptId,
      maxEvents,
      attemptTtlSeconds,
      ...flags,
    );
    return Number(accepted);
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
