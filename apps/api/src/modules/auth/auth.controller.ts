import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { toPublicUser } from "../users/public-user";
import { User } from "../users/user.entity";
import { AuthService } from "./auth.service";
import { ConfirmEmailDto, LoginDto, RefreshDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post("confirm")
  @HttpCode(200)
  confirm(@Body() body: ConfirmEmailDto) {
    return this.auth.confirmEmail(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body);
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Body() body: RefreshDto) {
    return this.auth.logout(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }
}
