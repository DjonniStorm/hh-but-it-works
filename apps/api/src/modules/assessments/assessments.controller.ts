import { Body, Controller, Post, UseGuards } from "@nestjs/common";
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
  AssessmentAttemptDto,
  AssessmentResultDto,
  StartAssessmentDto,
  SubmitAssessmentDto,
} from "./dto";

@Controller("assessment")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Candidate)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post("attempts")
  @ZodResponse({ status: 201, type: AssessmentAttemptDto })
  start(@CurrentUser() user: User, @Body() body: StartAssessmentDto) {
    return this.assessments.start(user.id, body.grade);
  }

  @Post("attempts/submit")
  @ZodResponse({ status: 200, type: AssessmentResultDto })
  submit(@CurrentUser() user: User, @Body() body: SubmitAssessmentDto) {
    return this.assessments.submit(user.id, body);
  }
}
