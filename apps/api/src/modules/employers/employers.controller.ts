import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
  invalidId,
} from "../../common/openapi/api-errors.decorator";
import { User } from "../users/user.entity";
import {
  CompanyProfileDto,
  CompanyResponseDto,
  HiringNeedDto,
  HiringNeedInputDto,
  HiringNeedListDto,
  InvitationDto,
  InvitationInputDto,
  InvitationListDto,
  ShortlistDto,
} from "./dto";
import { EmployersService } from "./employers.service";
import { InvitationsService } from "./invitations.service";

const needNotFound = "Потребности нет или она чужая";

// Подборку считает сервис ранжирования: без него ручка отвечает 503.
const shortlistErrors = {
  400: invalidId,
  404: needNotFound,
  503: "Сервис ранжирования недоступен",
};

@Controller("employer")
@Auth(Role.Employer)
export class EmployersController {
  constructor(
    private readonly employers: EmployersService,
    private readonly invitations: InvitationsService,
  ) {}

  @Get("company")
  @ZodResponse({ status: 200, type: CompanyResponseDto })
  getCompany(@CurrentUser() user: User) {
    return this.employers.getCompany(user.id);
  }

  @Put("company")
  @ZodResponse({ status: 200, type: CompanyProfileDto })
  @ApiErrors({ 400: invalidBody })
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
  @ApiErrors({ 400: invalidBody })
  createNeed(@CurrentUser() user: User, @Body() body: HiringNeedInputDto) {
    return this.employers.createNeed(user.id, body);
  }

  @Get("needs/:id")
  @ZodResponse({ status: 200, type: HiringNeedDto })
  @ApiErrors({ 400: invalidId, 404: needNotFound })
  getNeed(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.employers.getNeed(user.id, id);
  }

  @Get("needs/:id/shortlist")
  @ZodResponse({ status: 200, type: ShortlistDto })
  @ApiErrors(shortlistErrors)
  shortlist(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.employers.shortlist(user.id, id);
  }

  // «Не подходит»: скрыть кандидата в этой потребности. Ответ — обновлённая подборка.
  @Put("needs/:id/dismissed/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  @ApiErrors(shortlistErrors)
  dismiss(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setDismissed(user.id, id, candidateId, true);
  }

  @Put("needs/:id/favorites/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  @ApiErrors(shortlistErrors)
  favorite(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setFavorite(user.id, id, candidateId, true);
  }

  @Delete("needs/:id/favorites/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  @ApiErrors(shortlistErrors)
  unfavorite(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setFavorite(user.id, id, candidateId, false);
  }

  @Delete("needs/:id/dismissed/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  @ApiErrors(shortlistErrors)
  restore(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setDismissed(user.id, id, candidateId, false);
  }

  @Get("invitations")
  @ZodResponse({ status: 200, type: InvitationListDto })
  listInvitations(@CurrentUser() user: User) {
    return this.invitations.list(user.id);
  }

  @Post("invitations/:id/withdraw")
  @ZodResponse({ status: 200, type: InvitationDto })
  @ApiErrors({
    400: invalidId,
    404: "Приглашения нет или оно чужое",
    409: "Кандидат уже ответил или приглашение уже отозвано",
  })
  withdraw(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.withdraw(user.id, id);
  }

  @Post("invitations")
  @ZodResponse({ status: 201, type: InvitationDto })
  @ApiErrors({
    400: `${invalidBody}. Или профиль компании не заполнен`,
    404: "Кандидата нет на бирже или потребность не найдена",
    409: "У кандидата уже есть активное приглашение от компании",
  })
  createInvitation(
    @CurrentUser() user: User,
    @Body() body: InvitationInputDto,
  ) {
    return this.invitations.create(user.id, body);
  }
}
