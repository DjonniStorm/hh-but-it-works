import { createZodDto } from "nestjs-zod";

import {
  candidateProfileSchema,
  resumeDraftSchema,
  resumePdfQuerySchema,
  saveProfileSchema,
} from "@hh/contracts";

export class CandidateProfileDto extends createZodDto(candidateProfileSchema) {}
export class SaveProfileDto extends createZodDto(saveProfileSchema) {}
export class ResumeDraftDto extends createZodDto(resumeDraftSchema) {}
export class ResumePdfQueryDto extends createZodDto(resumePdfQuerySchema) {}
