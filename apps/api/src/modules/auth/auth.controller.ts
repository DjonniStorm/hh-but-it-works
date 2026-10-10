import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { ZodResponse } from "nestjs-zod";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
} from "../../common/openapi/api-errors.decorator";
import { toPublicUser } from "../users/public-user";
import { User } from "../users/user.entity";
import { AuthService } from "./auth.service";
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  PublicUserDto,
  RegisterDto,
  ResendConfirmationDto,
  ResetPasswordDto,
  SessionDto,
} from "./dto";
import { RefreshCookie } from "./refresh-cookie";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: RefreshCookie,
  ) {}

  @Post("register")
  @ZodResponse({ status: 201, type: PublicUserDto })
  @ApiErrors({ 400: invalidBody, 409: "Пользователь с такой почтой уже есть" })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post("confirm")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: PublicUserDto })
  @ApiErrors({
    400: invalidBody,
    401: "Ссылка подтверждения недействительна или уже использована",
  })
  confirm(@Body() body: ConfirmEmailDto) {
    return this.auth.confirmEmail(body);
  }

  // Ответ одинаковый для любой почты: по нему не узнать, кто зарегистрирован.
  @Post("confirm/resend")
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiErrors({
    400: invalidBody,
    429: "Письмо на этот адрес уже отправлено, повторная отправка доступна через минуту",
  })
  resendConfirmation(@Body() body: ResendConfirmationDto) {
    return this.auth.resendConfirmation(body);
  }

  // Как и resend: ответ одинаковый для любой почты.
  @Post("password/forgot")
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiErrors({
    400: invalidBody,
    429: "Письмо на этот адрес уже отправлено, повторная отправка доступна через минуту",
  })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body);
  }

  @Post("password/reset")
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiErrors({
    400: invalidBody,
    401: "Ссылка сброса пароля недействительна, истекла или уже использована",
  })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }

  @Post("login")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: SessionDto })
  @ApiErrors({
    400: invalidBody,
    401: "Неверная почта или пароль",
    403: "Почта не подтверждена",
  })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...session } = await this.auth.login(body);
    this.cookie.set(req, res, refreshToken);
    return session;
  }

  @Post("refresh")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: SessionDto })
  @ApiErrors({
    401: "Cookie hh_refresh нет, или refresh-токен в ней недействителен, истёк или уже использован",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.cookie.read(req);
    try {
      const { refreshToken, ...session } = await this.auth.refresh(token);
      if (refreshToken) {
        this.cookie.set(req, res, refreshToken);
      }
      return session;
    } catch (error) {
      // Токен из cookie больше не примут: стираем, чтобы браузер его не слал.
      // На 5xx cookie не трогаем: сбой временный, сессия ещё жива.
      if (token && error instanceof UnauthorizedException) {
        this.cookie.clear(req, res);
      }
      throw error;
    }
  }

  // Тела нет, токен — из cookie. Ответ 204 и без неё: выйти можно всегда.
  @Post("logout")
  @HttpCode(204)
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookie.read(req));
    this.cookie.clear(req, res);
  }

  @Get("me")
  @Auth()
  @ZodResponse({ status: 200, type: PublicUserDto })
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }
}
