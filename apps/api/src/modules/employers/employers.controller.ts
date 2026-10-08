import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { User } from "../users/user.entity";
import {
  CandidateSearchDto,
  CandidateSearchResultDto,
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

@Controller("employer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Employer)
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

  @Put("needs/:id")
  @ZodResponse({ status: 200, type: HiringNeedDto })
  updateNeed(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: HiringNeedInputDto,
  ) {
    return this.employers.updateNeed(user.id, id, body);
  }

  @Delete("needs/:id")
  @HttpCode(204)
  @ApiNoContentResponse()
  deleteNeed(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.employers.deleteNeed(user.id, id);
  }

  @Get("needs/:id/shortlist")
  @ZodResponse({ status: 200, type: ShortlistDto })
  shortlist(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.employers.shortlist(user.id, id);
  }

  // «Не подходит»: скрыть кандидата в этой потребности. Ответ — обновлённая подборка.
  @Put("needs/:id/dismissed/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  dismiss(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setDismissed(user.id, id, candidateId, true);
  }

  @Put("needs/:id/favorites/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  favorite(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setFavorite(user.id, id, candidateId, true);
  }

  @Delete("needs/:id/favorites/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  unfavorite(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setFavorite(user.id, id, candidateId, false);
  }

  @Delete("needs/:id/dismissed/:candidateId")
  @ZodResponse({ status: 200, type: ShortlistDto })
  restore(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("candidateId", new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.employers.setDismissed(user.id, id, candidateId, false);
  }

  // Фильтры в теле, а не в query: массивы грейдов и навыков без разбора строк.
  @Post("candidates/search")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: CandidateSearchResultDto })
  searchCandidates(@Body() body: CandidateSearchDto) {
    return this.employers.searchCandidates(body);
  }

  @Get("invitations")
  @ZodResponse({ status: 200, type: InvitationListDto })
  listInvitations(@CurrentUser() user: User) {
    return this.invitations.list(user.id);
  }

  @Post("invitations/:id/withdraw")
  @ZodResponse({ status: 200, type: InvitationDto })
  withdraw(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.withdraw(user.id, id);
  }

  @Post("invitations")
  @ZodResponse({ status: 201, type: InvitationDto })
  createInvitation(
    @CurrentUser() user: User,
    @Body() body: InvitationInputDto,
  ) {
    return this.invitations.create(user.id, body);
  }
}
