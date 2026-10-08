import { Body, Controller, Get, Headers, Ip, Post } from "@nestjs/common";
import { ZodResponse } from "nestjs-zod";

import { Role } from "@hh/types";

import { Auth } from "../../common/auth/auth.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import {
  ApiErrors,
  invalidBody,
} from "../../common/openapi/api-errors.decorator";
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
@Auth(Role.Candidate)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post("attempts")
  @ZodResponse({ status: 201, type: ActiveAttemptDto })
  @ApiErrors({
    400: `${invalidBody}. Или анкета не сохранена, для её навыков нет вопросов`,
    409: "Уже идёт другая попытка или грейд пока нельзя сменить",
  })
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
  @ApiErrors({
    400: `${invalidBody}. Или попытки нет: её закрыли или истекло время`,
    409: "Вопрос уже закрыт или все вопросы отвечены",
  })
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
  @ApiErrors({ 400: `${invalidBody}. Или попытки нет` })
  events(@CurrentUser() user: User, @Body() body: AssessmentEventsDto) {
    return this.assessments.events(user.id, body);
  }

  @Post("attempts/finish")
  @ZodResponse({ status: 200, type: AssessmentResultDto })
  @ApiErrors({
    400: `${invalidBody}. Или попытки нет: её уже завершили или истекло время`,
    409: "Специализация в анкете сменилась во время теста",
  })
  finish(@CurrentUser() user: User, @Body() body: FinishAssessmentDto) {
    return this.assessments.finish(user.id, body.attemptId);
  }

  @Get("attempts/history")
  @ZodResponse({ status: 200, type: AssessmentHistoryDto })
  history(@CurrentUser() user: User) {
    return this.assessments.history(user.id);
  }
}
