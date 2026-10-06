import { createZodDto } from "nestjs-zod";

import {
  activeAttemptSchema,
  answerAssessmentSchema,
  assessmentEventsAcceptedSchema,
  assessmentEventsSchema,
  assessmentHistorySchema,
  assessmentResultSchema,
  currentAttemptSchema,
  finishAssessmentSchema,
  startAssessmentSchema,
} from "@hh/contracts";

export class StartAssessmentDto extends createZodDto(startAssessmentSchema) {}
export class ActiveAttemptDto extends createZodDto(activeAttemptSchema) {}
export class CurrentAttemptDto extends createZodDto(currentAttemptSchema) {}
export class AnswerAssessmentDto extends createZodDto(answerAssessmentSchema) {}
export class AssessmentEventsDto extends createZodDto(assessmentEventsSchema) {}
export class AssessmentEventsAcceptedDto extends createZodDto(
  assessmentEventsAcceptedSchema,
) {}
export class FinishAssessmentDto extends createZodDto(finishAssessmentSchema) {}
export class AssessmentResultDto extends createZodDto(assessmentResultSchema) {}
export class AssessmentHistoryDto extends createZodDto(
  assessmentHistorySchema,
) {}
