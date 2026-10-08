import { createHash } from "node:crypto";

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const emailConfirmTtlSeconds = 60 * 60 * 24;
const refreshTtlSeconds = 60 * 60 * 24 * 7;
const confirmResendCooldownSeconds = 60;

@Injectable()
export class SessionStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      lazyConnect: process.env.OPENAPI_EXPORT === "1",
    });
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

  // Письмо подтверждения не чаще раза в минуту на адрес. false — минута не прошла.
  async claimConfirmSend(email: string): Promise<boolean> {
    const result = await this.redis.set(
      this.confirmSendKey(email),
      "1",
      "EX",
      confirmResendCooldownSeconds,
      "NX",
    );
    return result === "OK";
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

  private confirmSendKey(email: string): string {
    return `email-confirm-sent:${hashToken(email)}`;
  }

  private refreshKey(token: string): string {
    return `refresh:${hashToken(token)}`;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
