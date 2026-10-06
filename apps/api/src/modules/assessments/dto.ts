import { createZodDto } from "nestjs-zod";

import {
  assessmentAttemptSchema,
  assessmentResultSchema,
  startAssessmentSchema,
  submitAssessmentSchema,
} from "@hh/contracts";

export class StartAssessmentDto extends createZodDto(startAssessmentSchema) {}
export class AssessmentAttemptDto extends createZodDto(
  assessmentAttemptSchema,
) {}
export class SubmitAssessmentDto extends createZodDto(submitAssessmentSchema) {}
export class AssessmentResultDto extends createZodDto(assessmentResultSchema) {}
