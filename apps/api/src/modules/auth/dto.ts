import { createZodDto } from "nestjs-zod";

import {
  confirmEmailSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "@hh/contracts";

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ConfirmEmailDto extends createZodDto(confirmEmailSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
