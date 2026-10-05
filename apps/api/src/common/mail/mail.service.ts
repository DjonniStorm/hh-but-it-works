import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  sendConfirmation(email: string, link: string): void {
    this.logger.log(`confirmation for ${email}: ${link}`);
  }
}
