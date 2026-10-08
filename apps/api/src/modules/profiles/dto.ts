import { createZodDto } from "nestjs-zod";

import {
  candidateProfileSchema,
  resumeDraftSchema,
  saveProfileSchema,
} from "@hh/contracts";

export class CandidateProfileDto extends createZodDto(candidateProfileSchema) {}
export class SaveProfileDto extends createZodDto(saveProfileSchema) {}
export class ResumeDraftDto extends createZodDto(resumeDraftSchema) {}
