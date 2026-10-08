import { randomBytes } from "node:crypto";

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { MailService } from "../../common/mail/mail.service";
import { PublicUser, toPublicUser } from "../users/public-user";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { ConfirmEmailDto, LoginDto, RefreshDto, RegisterDto } from "./dto";
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
    const token = randomBytes(32).toString("base64url");
    await this.sessions.saveEmailConfirm(token, user.id);
    await this.mail.sendConfirmation(email, this.confirmationLink(token));
    return toPublicUser(user);
  }

  async confirmEmail(input: ConfirmEmailDto): Promise<PublicUser> {
    const userId = await this.sessions.takeEmailConfirm(input.token);
    if (!userId) {
      throw new UnauthorizedException("Ссылка подтверждения недействительна");
    }
    const user = await this.users.markEmailVerified(userId);
    return toPublicUser(user);
  }

  async login(input: LoginDto): Promise<Session> {
    const user = await this.users.findForLogin(normalizeEmail(input.email));
    const passwordOk =
      user !== null && (await this.users.passwordMatches(user, input.password));
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

  private confirmationLink(token: string): string {
    const origin =
      this.config.get<string>("WEB_URL") ?? "http://localhost:5173";
    return `${origin}/auth/confirm?token=${encodeURIComponent(token)}`;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
