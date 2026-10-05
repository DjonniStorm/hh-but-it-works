import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { toPublicUser } from "../users/public-user";
import { User } from "../users/user.entity";
import { AuthService } from "./auth.service";
import {
  ConfirmEmailDto,
  LoginDto,
  PublicUserDto,
  RefreshDto,
  RegisterDto,
  SessionDto,
} from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ZodResponse({ status: 201, type: PublicUserDto })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post("confirm")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: PublicUserDto })
  confirm(@Body() body: ConfirmEmailDto) {
    return this.auth.confirmEmail(body);
  }

  @Post("login")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: SessionDto })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: SessionDto })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body);
  }

  @Post("logout")
  @HttpCode(204)
  @ApiNoContentResponse()
  logout(@Body() body: RefreshDto) {
    return this.auth.logout(body);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodResponse({ status: 200, type: PublicUserDto })
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }
}
