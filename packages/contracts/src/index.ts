import { z } from "zod";

import { Role } from "@hh/types";

export const roleSchema = z.enum(Role);

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: roleSchema,
  consent: z.literal(true),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const confirmEmailSchema = z.object({
  token: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
