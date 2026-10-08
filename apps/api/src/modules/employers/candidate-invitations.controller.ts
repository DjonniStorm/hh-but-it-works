import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";

import { InvitationStatus, Role } from "@hh/types";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
  invalidId,
} from "../../common/openapi/api-errors.decorator";
import { User } from "../users/user.entity";
import {
  CandidateInvitationDto,
  CandidateInvitationListDto,
  MarkInvitationsViewedDto,
} from "./dto";
import { InvitationsService } from "./invitations.service";

const answerErrors = {
  400: invalidId,
  404: "Приглашения нет или оно не этому кандидату",
  409: "Кандидат уже ответил на приглашение",
};

@Controller("candidate/invitations")
@Auth(Role.Candidate)
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
  @ApiErrors({ 400: invalidBody })
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
  @ApiErrors(answerErrors)
  accept(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.answer(user.id, id, InvitationStatus.Accepted);
  }

  @Post(":id/decline")
  @HttpCode(200)
  @ZodResponse({ status: 200, type: CandidateInvitationDto })
  @ApiErrors(answerErrors)
  decline(
    @CurrentUser() user: User,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invitations.answer(user.id, id, InvitationStatus.Declined);
  }
}
