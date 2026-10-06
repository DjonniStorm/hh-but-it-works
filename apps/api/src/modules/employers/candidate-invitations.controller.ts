import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { InvitationStatus, Role } from "@hh/types";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { RolesGuard } from "../../common/auth/roles.guard";
import { User } from "../users/user.entity";
import {
  CandidateInvitationDto,
  CandidateInvitationListDto,
  MarkInvitationsViewedDto,
} from "./dto";
import { InvitationsService } from "./invitations.service";

@Controller("candidate/invitations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
export class CandidateInvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  @ZodResponse({ status: 200, type: CandidateInvitationListDto })
  list(@CurrentUser() user: User) {
    return this.invitations.listForCandidate(user.id);
  }

  // Отдельно от GET: чтение без побочных эффектов, отметку ставит экран после показа.
  @Post("viewed")
  @HttpCode(204)
  @ApiNoContentResponse()
  markViewed(
    @CurrentUser() user: User,
    @Body() body: MarkInvitationsViewedDto,
  ) {
    return this.invitations.markViewed(user.id, body.ids);
  }

  // После принятия работодатель видит контакт кандидата.
  @Post(":id/accept")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: CandidateInvitationDto })
  accept(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.answer(user.id, id, InvitationStatus.Accepted);
  }

  @Post(":id/decline")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: CandidateInvitationDto })
  decline(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.answer(user.id, id, InvitationStatus.Declined);
  }
}
