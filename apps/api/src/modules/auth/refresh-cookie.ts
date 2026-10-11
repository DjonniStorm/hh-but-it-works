import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";

import { refreshTtlSeconds } from "./session.store";

const cookieName = "hh_refresh";

// Префикс пути за прокси: Caddy снимает /api и передаёт его в X-Forwarded-Prefix.
// Только буквы, цифры, дефис и слеши — значение уходит в заголовок Set-Cookie.
const prefixPattern = /^(\/[\w-]+)*$/;

// Refresh-токен живёт в HttpOnly-cookie: скрипт страницы его не прочитает (#25).
// Path сужен до ручек auth, чтобы cookie не уходила с остальными запросами.
@Injectable()
export class RefreshCookie {
  private readonly production: boolean;

  constructor(config: ConfigService) {
    this.production = config.get<string>("NODE_ENV") === "production";
  }

  read(req: Request): string | null {
    const header = req.headers.cookie ?? "";
    for (const part of header.split(";")) {
      const [name, ...value] = part.trim().split("=");
      if (name === cookieName) {
        return decodeURIComponent(value.join("=")) || null;
      }
    }
    return null;
  }

  set(req: Request, res: Response, token: string): void {
    res.cookie(cookieName, token, {
      ...this.options(req),
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  clear(req: Request, res: Response): void {
    res.clearCookie(cookieName, this.options(req));
  }

  // Локально API отвечает на /auth/..., на проде браузер ходит в /api/auth/...
  private options(req: Request): CookieOptions {
    const prefix = req.get("x-forwarded-prefix") ?? "";
    return {
      httpOnly: true,
      sameSite: "strict",
      secure: this.production,
      path: `${prefixPattern.test(prefix) ? prefix : ""}/auth`,
    };
  }
}
