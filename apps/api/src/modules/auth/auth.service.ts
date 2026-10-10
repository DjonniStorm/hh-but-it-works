import { randomBytes } from "node:crypto";

import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { MailService } from "../../common/mail/mail.service";
import { PublicUser, toPublicUser } from "../users/public-user";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResendConfirmationDto,
  ResetPasswordDto,
} from "./dto";
import { SessionStore } from "./session.store";

type Session = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionStore,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterDto): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException("Пользователь с таким email уже есть");
    }

    const user = await this.users.create({
      email,
      password: input.password,
      role: input.role,
    });
    // Минута отсчитывается и от регистрации: сразу после неё повтор не нужен.
    await this.sessions.claimConfirmSend(email);
    const link = await this.createConfirmationLink(user.id);
    // Письмо уходит в фоне, как уведомления о приглашениях: регистрация не ждёт SMTP.
    void this.mail.sendConfirmation(email, link);
    return toPublicUser(user);
  }

  // Ответ одинаковый для любой почты. Лимит считается до поиска пользователя,
  // поэтому и 429 не говорит, есть ли такой адрес.
  async resendConfirmation(input: ResendConfirmationDto): Promise<void> {
    const email = normalizeEmail(input.email);
    if (!(await this.sessions.claimConfirmSend(email))) {
      throw new HttpException(
        "Письмо уже отправлено, повторить можно через минуту",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerifiedAt) {
      return;
    }
    const link = await this.createConfirmationLink(user.id);
    // SMTP не ждём: по времени ответа тоже не отличить существующий адрес.
    // sendConfirmation сам ловит и пишет в лог ошибку отправки.
    void this.mail.sendConfirmation(email, link);
  }

  async confirmEmail(input: ConfirmEmailDto): Promise<PublicUser> {
    const userId = await this.sessions.takeEmailConfirm(input.token);
    if (!userId) {
      throw new UnauthorizedException("Ссылка подтверждения недействительна");
    }
    const user = await this.users.markEmailVerified(userId);
    return toPublicUser(user);
  }

  // Ответ одинаковый для любой почты, лимит до поиска пользователя — как у resendConfirmation.
  async forgotPassword(input: ForgotPasswordDto): Promise<void> {
    const email = normalizeEmail(input.email);
    if (!(await this.sessions.claimPasswordResetSend(email))) {
      throw new HttpException(
        "Письмо уже отправлено, повторить можно через минуту",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const user = await this.users.findByEmail(email);
    if (!user) {
      return;
    }
    const token = randomBytes(32).toString("base64url");
    await this.sessions.savePasswordReset(token, user.id);
    // SMTP не ждём: по времени ответа не отличить существующий адрес.
    void this.mail.sendPasswordReset(email, this.webLink("/auth/reset", token));
  }

  // Токен одноразовый. После смены пароля все refresh-токены отзываются:
  // если пароль сбрасывают из-за утечки, старые сессии тоже не нужны.
  async resetPassword(input: ResetPasswordDto): Promise<void> {
    const userId = await this.sessions.takePasswordReset(input.token);
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) {
      throw new UnauthorizedException("Ссылка сброса пароля недействительна");
    }
    await this.users.resetPassword(user, input.password);
    await this.sessions.revokeUserRefresh(user.id);
  }

  async login(input: LoginDto): Promise<Session> {
    const user = await this.users.findForLogin(normalizeEmail(input.email));
    const passwordOk = await this.users.passwordMatches(user, input.password);
    if (!user || !passwordOk) {
      throw new UnauthorizedException("Неверный email или пароль");
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Почта не подтверждена");
    }
    return this.issueSession(user);
  }

  async refresh(input: RefreshDto): Promise<Session> {
    const userId = this.readRefreshUserId(input.refreshToken);
    if (!userId) {
      throw new UnauthorizedException("Сессия недействительна");
    }
    const storedUserId = await this.sessions.takeRefresh(input.refreshToken);
    if (storedUserId !== userId) {
      throw new UnauthorizedException("Сессия недействительна");
    }
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Сессия недействительна");
    }
    return this.issueSession(user);
  }

  async logout(input: RefreshDto): Promise<void> {
    if (!this.readRefreshUserId(input.refreshToken)) {
      throw new UnauthorizedException("Сессия недействительна");
    }
    await this.sessions.dropRefresh(input.refreshToken);
  }

  private async issueSession(user: User): Promise<Session> {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      },
    );
    await this.sessions.saveRefresh(refreshToken, user.id);
    return { accessToken, refreshToken, user: toPublicUser(user) };
  }

  private readRefreshUserId(token: string): string | null {
    try {
      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
      return payload.sub;
    } catch {
      return null;
    }
  }

  // Прежняя ссылка остаётся рабочей до конца своих суток.
  private async createConfirmationLink(userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    await this.sessions.saveEmailConfirm(token, userId);
    return this.webLink("/auth/confirm", token);
  }

  private webLink(path: string, token: string): string {
    return this.mail.webLink(`${path}?token=${encodeURIComponent(token)}`);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
