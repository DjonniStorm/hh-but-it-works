import { createHash } from "node:crypto";

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const emailConfirmTtlSeconds = 60 * 60 * 24;
const refreshTtlSeconds = 60 * 60 * 24 * 7;
const confirmResendCooldownSeconds = 60;
const passwordResetTtlSeconds = 60 * 60;
const passwordResetCooldownSeconds = 60;

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

  async savePasswordReset(token: string, userId: string): Promise<void> {
    await this.redis.set(
      this.passwordResetKey(token),
      userId,
      "EX",
      passwordResetTtlSeconds,
    );
  }

  takePasswordReset(token: string): Promise<string | null> {
    return this.redis.getdel(this.passwordResetKey(token));
  }

  // Письмо сброса не чаще раза в минуту на адрес. false — минута не прошла.
  async claimPasswordResetSend(email: string): Promise<boolean> {
    const result = await this.redis.set(
      this.passwordResetSentKey(email),
      "1",
      "EX",
      passwordResetCooldownSeconds,
      "NX",
    );
    return result === "OK";
  }

  // Кроме самого токена, его хеш лежит в наборе пользователя: по нему
  // revokeUserRefresh выходит со всех устройств разом.
  async saveRefresh(token: string, userId: string): Promise<void> {
    const userKey = this.userRefreshKey(userId);
    await this.redis
      .multi()
      .set(this.refreshKey(token), userId, "EX", refreshTtlSeconds)
      .sadd(userKey, hashToken(token))
      .expire(userKey, refreshTtlSeconds)
      .exec();
  }

  async takeRefresh(token: string): Promise<string | null> {
    const userId = await this.redis.getdel(this.refreshKey(token));
    if (userId) {
      await this.redis.srem(this.userRefreshKey(userId), hashToken(token));
    }
    return userId;
  }

  async dropRefresh(token: string): Promise<void> {
    await this.takeRefresh(token);
  }

  async revokeUserRefresh(userId: string): Promise<void> {
    const userKey = this.userRefreshKey(userId);
    const hashes = await this.redis.smembers(userKey);
    const keys = hashes.map((hash) => {
      return `refresh:${hash}`;
    });
    await this.redis.del(userKey, ...keys);
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

  private passwordResetKey(token: string): string {
    return `password-reset:${hashToken(token)}`;
  }

  private passwordResetSentKey(email: string): string {
    return `password-reset-sent:${hashToken(email)}`;
  }

  private refreshKey(token: string): string {
    return `refresh:${hashToken(token)}`;
  }

  private userRefreshKey(userId: string): string {
    return `user-refresh:${userId}`;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
