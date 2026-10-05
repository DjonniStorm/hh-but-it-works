import { z } from "zod";

import { Role } from "@hh/types";

export const roleSchema = z.enum(Role);

export const registerSchema = z.object({
  email: z.email("Укажите почту"),
  password: z.string().min(8, "Минимум 8 символов"),
  role: roleSchema,
  consent: z.literal(true, "Нужно согласие на обработку данных"),
});

export const loginSchema = z.object({
  email: z.email("Укажите почту"),
  password: z.string().min(1, "Введите пароль"),
});

export const confirmEmailSchema = z.object({
  token: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: roleSchema,
  emailVerifiedAt: z.iso.datetime().nullable(),
});

export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: publicUserSchema,
});

export const healthSchema = z.object({
  status: z.literal("ok"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Health = z.infer<typeof healthSchema>;
