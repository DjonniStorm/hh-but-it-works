import { createZodDto } from "nestjs-zod";

import { candidateProfileSchema, saveProfileSchema } from "@hh/contracts";

export class CandidateProfileDto extends createZodDto(candidateProfileSchema) {}
export class SaveProfileDto extends createZodDto(saveProfileSchema) {}
