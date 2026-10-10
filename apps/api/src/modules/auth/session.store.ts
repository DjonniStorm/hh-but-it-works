import { createHash } from "node:crypto";

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const emailConfirmTtlSeconds = 60 * 60 * 24;
export const refreshTtlSeconds = 60 * 60 * 24 * 7;
// Сколько старый refresh-токен ещё принимается после ротации, см. rotateRefresh.
const refreshGraceSeconds = 30;
const confirmResendCooldownSeconds = 60;
const passwordResetTtlSeconds = 60 * 60;
const passwordResetCooldownSeconds = 60;

// Атомарно: забрать токен и оставить на него окно, либо найти токен в окне.
// Отдельные GETDEL и SET дали бы второму из параллельных запросов промежуток,
// где токена уже нет, а окна ещё нет.
const rotateRefreshScript = `
local userId = redis.call("GETDEL", KEYS[1])
if userId then
  redis.call("SET", KEYS[2], userId, "EX", ARGV[1])
  return {userId, "rotated"}
end
local graced = redis.call("GET", KEYS[2])
if graced then
  return {graced, "grace"}
end
return nil
`;

export type RefreshRotation = {
  userId: string;
  // true — токен уже сменили, запрос пришёл в окне после ротации.
  grace: boolean;
};

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

  // Cookie с refresh общая на все вкладки. Если две вкладки обновляют сессию
  // одновременно, вторая приходит с токеном, который первая только что сменила.
  // Такой токен ещё refreshGraceSeconds принимается, но новый refresh по нему
  // не выдаётся: в cookie уже лежит тот, что выдан первой вкладке.
  async rotateRefresh(token: string): Promise<RefreshRotation | null> {
    const result = (await this.redis.eval(
      rotateRefreshScript,
      2,
      this.refreshKey(token),
      this.refreshGraceKey(token),
      refreshGraceSeconds,
    )) as [string, string] | null;
    if (!result) {
      return null;
    }
    const [userId, outcome] = result;
    if (outcome === "rotated") {
      await this.redis.srem(this.userRefreshKey(userId), hashToken(token));
    }
    return { userId, grace: outcome === "grace" };
  }

  async dropRefresh(token: string): Promise<void> {
    const userId = await this.redis.getdel(this.refreshKey(token));
    if (userId) {
      await this.redis.srem(this.userRefreshKey(userId), hashToken(token));
    }
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

  private refreshGraceKey(token: string): string {
    return `refresh-grace:${hashToken(token)}`;
  }

  private userRefreshKey(userId: string): string {
    return `user-refresh:${userId}`;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
