import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Transporter, createTransport } from "nodemailer";

import { confirmationLetter } from "./letters/confirmation";
import type { Letter } from "./letters/layout";

// Письма уходят в фоне, запрос их не ждёт. Таймаут только обрывает зависший
// SMTP: у nodemailer по умолчанию до десяти минут на сокет.
const timeoutMs = 30_000;

// Локально SMTP_HOST=localhost:1025 — это Mailpit из infra/dev,
// настоящая отправка — smtp.yandex.ru:465 с паролем приложения.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter;
  private readonly from: string | undefined;
  private readonly production: boolean;
  private readonly local: boolean;
  private readonly webUrl: string;

  constructor(config: ConfigService) {
    const host = config.getOrThrow<string>("SMTP_HOST");
    const port = Number(config.get<string>("SMTP_PORT") ?? 465);
    const user = config.get<string>("SMTP_USER");
    const pass = config.get<string>("SMTP_PASS");
    this.production = config.get<string>("NODE_ENV") === "production";
    this.local = host === "localhost" || host === "127.0.0.1";
    this.webUrl = config.get<string>("WEB_URL") ?? "http://localhost:5173";
    // Яндекс отклоняет письмо, если отправитель не совпадает с логином.
    this.from = config.get<string>("MAIL_FROM") || user;
    this.transport = createTransport({
      host,
      port,
      // 465 — TLS сразу, 587 и Mailpit — обычное соединение со STARTTLS, если есть.
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: timeoutMs,
      greetingTimeout: timeoutMs,
      socketTimeout: timeoutMs,
    });
  }

  // Ссылка из письма на страницу веба. Пути — из apps/web/src/shared/router/routes.ts.
  webLink(path: string): string {
    return `${this.webUrl}${path}`;
  }

  async sendConfirmation(email: string, link: string): Promise<void> {
    // Вне production ссылка ещё и в логе: можно подтвердить почту без ящика.
    if (!this.production) {
      this.logger.log(`confirmation for ${email}: ${link}`);
    }
    await this.send(email, confirmationLetter(link));
  }

  // Ошибку не пробрасываем: письмо — побочный эффект, действие пользователя
  // уже сохранено. Повторная регистрация, например, дала бы 409.
  async send(email: string, letter: Letter): Promise<void> {
    // Сид-кандидаты живут в зоне .test (RFC 2606): настоящий SMTP вернёт
    // их как недоставленные и испортит репутацию ящика. Mailpit ловит всё.
    if (!this.local && email.endsWith(".test")) {
      this.logger.log(
        `письмо «${letter.subject}» для ${email} пропущено: адрес .test`,
      );
      return;
    }
    try {
      await this.transport.sendMail({ from: this.from, to: email, ...letter });
    } catch (error) {
      this.logger.error(`Письмо для ${email} не ушло: ${String(error)}`);
    }
  }
}
