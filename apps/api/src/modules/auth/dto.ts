import { createZodDto } from "nestjs-zod";

import {
  confirmEmailSchema,
  forgotPasswordSchema,
  loginSchema,
  publicUserSchema,
  refreshSchema,
  registerSchema,
  resendConfirmationSchema,
  resetPasswordSchema,
  sessionSchema,
} from "@hh/contracts";

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ConfirmEmailDto extends createZodDto(confirmEmailSchema) {}
export class ResendConfirmationDto extends createZodDto(
  resendConfirmationSchema,
) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class SessionDto extends createZodDto(sessionSchema) {}
