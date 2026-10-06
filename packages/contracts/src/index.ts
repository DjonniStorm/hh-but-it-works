import { z } from "zod";

import {
  Grade,
  Role,
  SkillLevel,
  SkillVerification,
  Specialization,
} from "@hh/types";

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

export const specializationSchema = z.enum(Specialization);
export const gradeSchema = z.enum(Grade);
export const skillLevelSchema = z.enum(SkillLevel);
export const skillVerificationSchema = z.enum(SkillVerification);

export const profileSkillSchema = z.object({
  skillId: z.uuid(),
  slug: z.string(),
  title: z.string(),
  level: skillLevelSchema.nullable(),
  verification: skillVerificationSchema.nullable(),
});

const linkField = z.string().trim().max(120, "Слишком длинная ссылка");

export const candidateProfileSchema = z.object({
  displayName: z.string(),
  specialization: specializationSchema.nullable(),
  claimedGrade: gradeSchema.nullable(),
  fspId: z.string().max(64).nullable(),
  telegram: z.string().max(120).nullable(),
  github: z.string().max(120).nullable(),
  linkedin: z.string().max(120).nullable(),
  website: z.string().max(120).nullable(),
  listed: z.boolean(),
  skills: z.array(profileSkillSchema),
});

export const saveContactsSchema = z.object({
  displayName: z.string().trim().min(1, "Укажите имя"),
  specialization: specializationSchema,
  claimedGrade: gradeSchema,
  fspId: z.string().trim().max(64, "Слишком длинный ID"),
  telegram: linkField,
  github: linkField,
  linkedin: linkField,
  website: linkField,
});

export const saveSkillSchema = z.union([
  z.object({
    skillId: z.uuid(),
    level: skillLevelSchema.nullable(),
  }),
  z.object({
    title: z
      .string()
      .trim()
      .min(1, "Укажите навык")
      .max(80, "Слишком длинное название"),
    level: skillLevelSchema.nullable(),
  }),
]);

export const saveSkillsSchema = z.object({
  skills: z.array(saveSkillSchema),
});

export const saveProfileSchema = saveContactsSchema.extend({
  skills: saveSkillsSchema.shape.skills,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Health = z.infer<typeof healthSchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
