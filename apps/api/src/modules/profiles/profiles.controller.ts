import { Body, Controller, Get, Put } from "@nestjs/common";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
} from "../../common/openapi/api-errors.decorator";
import { User } from "../users/user.entity";
import { CandidateProfileDto, SaveProfileDto } from "./dto";
import { ProfilesService } from "./profiles.service";

@Controller("profile")
@Auth(Role.Candidate)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  @ZodResponse({ status: 200, type: CandidateProfileDto })
  get(@CurrentUser() user: User) {
    return this.profiles.get(user.id);
  }

  @Put()
  @ZodResponse({ status: 200, type: CandidateProfileDto })
  @ApiErrors({
    400: `${invalidBody}. Или навык пустой, skillId неизвестен, своих навыков больше лимита`,
  })
  save(@CurrentUser() user: User, @Body() body: SaveProfileDto) {
    return this.profiles.save(user.id, body);
  }
}
