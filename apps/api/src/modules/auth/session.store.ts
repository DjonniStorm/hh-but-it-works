import { createHash } from "node:crypto";

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const emailConfirmTtlSeconds = 60 * 60 * 24;
const refreshTtlSeconds = 60 * 60 * 24 * 7;

@Injectable()
export class SessionStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"));
  }

  async saveEmailConfirm(token: string, userId: string): Promise<void> {
    await this.redis.set(
      this.emailConfirmKey(token),
      userId,
      "EX",
      emailConfirmTtlSeconds,
    );
  }

  takeEmailConfirm(token: string): Promise<string | null> {
    return this.redis.getdel(this.emailConfirmKey(token));
  }

  async saveRefresh(token: string, userId: string): Promise<void> {
    await this.redis.set(
      this.refreshKey(token),
      userId,
      "EX",
      refreshTtlSeconds,
    );
  }

  takeRefresh(token: string): Promise<string | null> {
    return this.redis.getdel(this.refreshKey(token));
  }

  async dropRefresh(token: string): Promise<void> {
    await this.redis.del(this.refreshKey(token));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private emailConfirmKey(token: string): string {
    return `email-confirm:${hashToken(token)}`;
  }

  private refreshKey(token: string): string {
    return `refresh:${hashToken(token)}`;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
