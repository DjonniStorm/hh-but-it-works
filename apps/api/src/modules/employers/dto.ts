import { createZodDto } from "nestjs-zod";

import {
  candidateInvitationListSchema,
  candidateInvitationSchema,
  candidateSearchResultSchema,
  candidateSearchSchema,
  companyProfileSchema,
  companyResponseSchema,
  hiringNeedInputSchema,
  hiringNeedListSchema,
  hiringNeedSchema,
  invitationInputSchema,
  invitationListSchema,
  invitationSchema,
  markInvitationsViewedSchema,
  shortlistSchema,
} from "@hh/contracts";

export class CompanyProfileDto extends createZodDto(companyProfileSchema) {}
export class CompanyResponseDto extends createZodDto(companyResponseSchema) {}
export class HiringNeedInputDto extends createZodDto(hiringNeedInputSchema) {}
export class HiringNeedDto extends createZodDto(hiringNeedSchema) {}
export class HiringNeedListDto extends createZodDto(hiringNeedListSchema) {}
export class ShortlistDto extends createZodDto(shortlistSchema) {}
export class CandidateSearchDto extends createZodDto(candidateSearchSchema) {}
export class CandidateSearchResultDto extends createZodDto(
  candidateSearchResultSchema,
) {}
export class InvitationInputDto extends createZodDto(invitationInputSchema) {}
export class InvitationDto extends createZodDto(invitationSchema) {}
export class InvitationListDto extends createZodDto(invitationListSchema) {}
export class CandidateInvitationDto extends createZodDto(
  candidateInvitationSchema,
) {}
export class CandidateInvitationListDto extends createZodDto(
  candidateInvitationListSchema,
) {}
export class MarkInvitationsViewedDto extends createZodDto(
  markInvitationsViewedSchema,
) {}
