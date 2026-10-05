import { Controller, Get } from "@nestjs/common";
import { ZodResponse, createZodDto } from "nestjs-zod";

import { healthSchema } from "@hh/contracts";

class HealthDto extends createZodDto(healthSchema) {}

@Controller("health")
export class HealthController {
  @Get()
  @ZodResponse({ status: 200, type: HealthDto })
  health(): { status: "ok" } {
    return { status: "ok" };
  }
}
