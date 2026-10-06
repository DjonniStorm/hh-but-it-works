import { createZodDto } from "nestjs-zod";

import {
  companyProfileSchema,
  companyResponseSchema,
  hiringNeedInputSchema,
  hiringNeedListSchema,
  hiringNeedRecordSchema,
} from "@hh/contracts";

export class CompanyProfileDto extends createZodDto(companyProfileSchema) {}
export class CompanyResponseDto extends createZodDto(companyResponseSchema) {}
export class HiringNeedInputDto extends createZodDto(hiringNeedInputSchema) {}
export class HiringNeedDto extends createZodDto(hiringNeedRecordSchema) {}
export class HiringNeedListDto extends createZodDto(hiringNeedListSchema) {}
