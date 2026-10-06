import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { User } from "../users/user.entity";
import {
  CompanyProfileDto,
  CompanyResponseDto,
  HiringNeedDto,
  HiringNeedInputDto,
  HiringNeedListDto,
} from "./dto";
import { EmployersService } from "./employers.service";

@Controller("employer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Employer)
export class EmployersController {
  constructor(private readonly employers: EmployersService) {}

  @Get("company")
  @ZodResponse({ status: 200, type: CompanyResponseDto })
  getCompany(@CurrentUser() user: User) {
    return this.employers.getCompany(user.id);
  }

  @Put("company")
  @ZodResponse({ status: 200, type: CompanyProfileDto })
  saveCompany(@CurrentUser() user: User, @Body() body: CompanyProfileDto) {
    return this.employers.saveCompany(user.id, body);
  }

  @Get("needs")
  @ZodResponse({ status: 200, type: HiringNeedListDto })
  listNeeds(@CurrentUser() user: User) {
    return this.employers.listNeeds(user.id);
  }

  @Post("needs")
  @ZodResponse({ status: 201, type: HiringNeedDto })
  createNeed(@CurrentUser() user: User, @Body() body: HiringNeedInputDto) {
    return this.employers.createNeed(user.id, body);
  }

  @Get("needs/:id")
  @ZodResponse({ status: 200, type: HiringNeedDto })
  getNeed(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.employers.getNeed(user.id, id);
  }
}
