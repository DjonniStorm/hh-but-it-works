import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Transporter, createTransport } from "nodemailer";

import { confirmationLetter } from "./confirmation-letter";

// Зависший SMTP не должен держать регистрацию: по умолчанию nodemailer ждёт минуты.
const timeoutMs = 10_000;

// Без SMTP_HOST письма не уходят, ссылка только в логе: так работают openapi-экспорт
// и все, у кого нет кредов. Локально SMTP_HOST=localhost:1025 — это Mailpit
// из infra/dev, настоящая отправка — smtp.yandex.ru:465 с паролем приложения.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null;
  private readonly from: string | undefined;
  private readonly production: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>("SMTP_HOST");
    const port = Number(config.get<string>("SMTP_PORT") ?? 465);
    const user = config.get<string>("SMTP_USER");
    const pass = config.get<string>("SMTP_PASS");
    this.production = config.get<string>("NODE_ENV") === "production";
    // Яндекс отклоняет письмо, если отправитель не совпадает с логином.
    this.from = config.get<string>("MAIL_FROM") || user;
    this.transport = host
      ? createTransport({
          host,
          port,
          // 465 — TLS сразу, 587 и Mailpit — обычное соединение со STARTTLS, если есть.
          secure: port === 465,
          auth: user ? { user, pass } : undefined,
          connectionTimeout: timeoutMs,
          greetingTimeout: timeoutMs,
          socketTimeout: timeoutMs,
        })
      : null;
  }

  // Ошибку не пробрасываем: пользователь уже создан, и повторная регистрация дала бы 409.
  async sendConfirmation(email: string, link: string): Promise<void> {
    if (!this.transport || !this.production) {
      this.logger.log(`confirmation for ${email}: ${link}`);
    }
    if (!this.transport) {
      return;
    }
    try {
      await this.transport.sendMail({
        from: this.from,
        to: email,
        ...confirmationLetter(link),
      });
    } catch (error) {
      this.logger.error(`Письмо для ${email} не ушло: ${String(error)}`);
    }
  }
}
