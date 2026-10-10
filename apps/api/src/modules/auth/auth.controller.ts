import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
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
  RefreshDto,
  RegisterDto,
  ResendConfirmationDto,
  ResetPasswordDto,
  SessionDto,
} from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: SessionDto })
  @ApiErrors({
    400: invalidBody,
    401: "Refresh-токен недействителен, истёк или уже использован",
  })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body);
  }

  @Post("logout")
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiErrors({
    400: invalidBody,
    401: "Refresh-токен недействителен или истёк",
  })
  logout(@Body() body: RefreshDto) {
    return this.auth.logout(body);
  }

  @Get("me")
  @Auth()
  @ZodResponse({ status: 200, type: PublicUserDto })
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }
}
