import { createZodDto } from "nestjs-zod";

import {
  candidateProfileSchema,
  fspHistorySchema,
  fspLinkPreviewSchema,
  resumeDraftSchema,
  resumePdfQuerySchema,
  saveProfileSchema,
} from "@hh/contracts";

export class CandidateProfileDto extends createZodDto(candidateProfileSchema) {}
export class SaveProfileDto extends createZodDto(saveProfileSchema) {}
export class ResumeDraftDto extends createZodDto(resumeDraftSchema) {}
export class ResumePdfQueryDto extends createZodDto(resumePdfQuerySchema) {}
export class FspLinkPreviewDto extends createZodDto(fspLinkPreviewSchema) {}
export class FspHistoryDto extends createZodDto(fspHistorySchema) {}
