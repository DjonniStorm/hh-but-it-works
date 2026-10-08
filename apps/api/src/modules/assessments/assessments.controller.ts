import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
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
import { AssessmentsService } from "./assessments.service";
import {
  ActiveAttemptDto,
  AnswerAssessmentDto,
  AssessmentEventsAcceptedDto,
  AssessmentEventsDto,
  AssessmentHistoryDto,
  AssessmentResultDto,
  CurrentAttemptDto,
  FinishAssessmentDto,
  StartAssessmentDto,
} from "./dto";

@Controller("assessment")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post("attempts")
  @ZodResponse({ status: 201, type: ActiveAttemptDto })
  start(
    @CurrentUser() user: User,
    @Body() body: StartAssessmentDto,
    @Ip() ip: string,
    @Headers("user-agent") agent: string | undefined,
  ) {
    return this.assessments.start(user.id, body.grade, {
      ip,
      agent: agent ?? "",
    });
  }

  @Get("attempts/current")
  @ZodResponse({ status: 200, type: CurrentAttemptDto })
  current(@CurrentUser() user: User) {
    return this.assessments.current(user.id);
  }

  @Post("attempts/answer")
  @ZodResponse({ status: 200, type: ActiveAttemptDto })
  answer(
    @CurrentUser() user: User,
    @Body() body: AnswerAssessmentDto,
    @Ip() ip: string,
    @Headers("user-agent") agent: string | undefined,
  ) {
    return this.assessments.answer(user.id, body, { ip, agent: agent ?? "" });
  }

  @Post("attempts/events")
  @ZodResponse({ status: 200, type: AssessmentEventsAcceptedDto })
  events(@CurrentUser() user: User, @Body() body: AssessmentEventsDto) {
    return this.assessments.events(user.id, body);
  }

  @Post("attempts/finish")
  @ZodResponse({ status: 200, type: AssessmentResultDto })
  finish(@CurrentUser() user: User, @Body() body: FinishAssessmentDto) {
    return this.assessments.finish(user.id, body.attemptId);
  }

  @Get("attempts/history")
  @ZodResponse({ status: 200, type: AssessmentHistoryDto })
  history(@CurrentUser() user: User) {
    return this.assessments.history(user.id);
  }
}
