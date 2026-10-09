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
    400: `${invalidBody}. Также: анкета не сохранена или для её навыков нет вопросов`,
    409: "Есть незавершённая попытка или смена грейда пока недоступна",
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
    400: `${invalidBody}. Также: попытка не найдена, завершена или время истекло`,
    409: "Вопрос уже закрыт или на все вопросы даны ответы",
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
  @ApiErrors({ 400: `${invalidBody}. Также: попытка не найдена` })
  events(@CurrentUser() user: User, @Body() body: AssessmentEventsDto) {
    return this.assessments.events(user.id, body);
  }

  @Post("attempts/finish")
  @ZodResponse({ status: 200, type: AssessmentResultDto })
  @ApiErrors({
    400: `${invalidBody}. Также: попытка не найдена, уже завершена или время истекло`,
    409: "Специализация в анкете изменилась во время теста",
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
