import { z } from "zod";

import {
  Grade,
  InvitationStatus,
  Role,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
  WorkFormat,
  gradeIndex,
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

// Черновик модели работодателя. Ручек под неё ещё нет, веб пока ходит в мок.

export const workFormatSchema = z.enum(WorkFormat, "Выберите формат работы");
export const invitationStatusSchema = z.enum(InvitationStatus);
export const searchStatusSchema = z.enum(SearchStatus);

const salaryShape = {
  salaryFrom: z
    .number("Укажите сумму")
    .int("Только целые рубли")
    .positive("Сумма должна быть больше нуля"),
  salaryTo: z
    .number("Укажите сумму")
    .int("Только целые рубли")
    .positive("Сумма должна быть больше нуля"),
};

function salaryRangeValid(value: {
  salaryFrom: number;
  salaryTo: number;
}): boolean {
  return value.salaryFrom <= value.salaryTo;
}

const salaryRangeIssue = {
  message: "Верхняя граница меньше нижней",
  path: ["salaryTo"],
};

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, "Укажите название компании"),
  industry: z.string().min(1, "Выберите направление"),
  description: z
    .string()
    .trim()
    .min(20, "Расскажите о компании хотя бы в паре предложений"),
  // Только http и https: иначе пройдёт javascript:, а сайт потом покажут ссылкой.
  website: z.union([
    z.literal(""),
    z.url({
      protocol: /^https?$/,
      error: "Ссылка целиком, с http:// или https://",
    }),
  ]),
  contactEmail: z.email("Укажите почту"),
  contactTelegram: z.string().trim(),
});

// «React» и «react» — один навык: иначе ранжирование засчитает его дважды.
const skillListSchema = z
  .array(z.string().trim().min(1))
  .max(10, "Не больше 10 навыков")
  .refine(
    (skills) => {
      const keys = skills.map((skill) => {
        return skill.toLowerCase();
      });
      return new Set(keys).size === keys.length;
    },
    { message: "Навык указан дважды" },
  );

const hiringNeedShape = {
  title: z.string().trim().min(3, "Назовите потребность"),
  // Свои тексты ошибок: форма показывает их под селектами.
  specialization: z.enum(Specialization, "Выберите специализацию"),
  gradeFrom: z.enum(Grade, "Выберите грейд"),
  gradeTo: z.enum(Grade, "Выберите грейд"),
  mustSkills: skillListSchema.min(
    1,
    "Добавьте хотя бы один обязательный навык",
  ),
  niceSkills: skillListSchema,
  workFormat: workFormatSchema,
  ...salaryShape,
  description: z.string().trim().max(2000, "Слишком длинное описание"),
};

export const hiringNeedInputSchema = z
  .object(hiringNeedShape)
  .refine(
    (value) => {
      return gradeIndex(value.gradeFrom) <= gradeIndex(value.gradeTo);
    },
    { message: "Грейд «до» ниже грейда «от»", path: ["gradeTo"] },
  )
  .refine(salaryRangeValid, salaryRangeIssue);

export const hiringNeedSchema = z.object({
  ...hiringNeedShape,
  id: z.string(),
  createdAt: z.iso.datetime(),
  candidateCount: z.number().int().min(0),
});

// Навык в форме profileSkillSchema плюс балл теста, если навык подтверждён.
export const candidateSkillSchema = z.object({
  title: z.string(),
  level: skillLevelSchema.nullable(),
  verification: skillVerificationSchema,
  score: z.number().min(0).max(100).nullable(),
});

export const fspAchievementSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  place: z.number().int().positive().nullable(),
});

export const candidatePreferencesSchema = z.object({
  desiredSalaryFrom: z.number().int().positive(),
  workFormats: z.array(workFormatSchema).min(1),
  searchStatus: searchStatusSchema,
});

// То, что работодатель видит до согласия кандидата: без контактов и чувствительных признаков.
export const candidateSnapshotSchema = z.object({
  id: z.string(),
  alias: z.string(),
  specialization: specializationSchema,
  claimedGrade: gradeSchema,
  verifiedGrade: gradeSchema.nullable(),
  gradeConfidence: z.number().min(0).max(1).nullable(),
  experienceYears: z.number().min(0),
  skills: z.array(candidateSkillSchema),
  assessmentScore: z.number().min(0).max(100).nullable(),
  fspAchievements: z.array(fspAchievementSchema),
  preferences: candidatePreferencesSchema,
});

export const matchGroupSchema = z.enum([
  "category",
  "skills",
  "assessment",
  "fsp",
  "preferences",
]);

export const matchBreakdownSchema = z.object({
  group: matchGroupSchema,
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  details: z.array(z.string()),
});

export const matchSchema = z.object({
  candidate: candidateSnapshotSchema,
  matchScore: z.number().min(0).max(100),
  qualification: z.number().min(0).max(100),
  opportunityFit: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
  breakdown: z.array(matchBreakdownSchema),
  dismissed: z.boolean(),
});

export const shortlistSchema = z.object({
  needId: z.string(),
  modelVersion: z.string(),
  items: z.array(matchSchema),
});

const invitationShape = {
  candidateId: z.string().min(1),
  needId: z.string().nullable(),
  message: z
    .string()
    .trim()
    .min(20, "Опишите предложение: задачи, команда, условия"),
  contact: z.string().trim().min(3, "Укажите способ связи"),
  ...salaryShape,
};

export const invitationInputSchema = z
  .object(invitationShape)
  .refine(salaryRangeValid, salaryRangeIssue);

export const invitationSchema = z.object({
  ...invitationShape,
  id: z.string(),
  status: invitationStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  companyName: z.string(),
  candidateAlias: z.string(),
  needTitle: z.string().nullable(),
  // Контакт кандидата раскрывается только после принятия приглашения.
  candidateContact: z.string().nullable(),
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
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type HiringNeedInput = z.infer<typeof hiringNeedInputSchema>;
export type HiringNeed = z.infer<typeof hiringNeedSchema>;
export type CandidateSkill = z.infer<typeof candidateSkillSchema>;
export type FspAchievement = z.infer<typeof fspAchievementSchema>;
export type CandidatePreferences = z.infer<typeof candidatePreferencesSchema>;
export type CandidateSnapshot = z.infer<typeof candidateSnapshotSchema>;
export type MatchGroup = z.infer<typeof matchGroupSchema>;
export type MatchBreakdown = z.infer<typeof matchBreakdownSchema>;
export type Match = z.infer<typeof matchSchema>;
export type Shortlist = z.infer<typeof shortlistSchema>;
export type InvitationInput = z.infer<typeof invitationInputSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
