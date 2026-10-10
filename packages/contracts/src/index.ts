import { z } from "zod";

import {
  AttemptStatus,
  FspAchievementKind,
  FspAchievementLevel,
  FspSportRank,
  Grade,
  IntegrityFlag,
  InvitationStatus,
  ResumeTemplate,
  Role,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
  WorkFormat,
  gradeIndex,
} from "@hh/types";

export * from "./format";

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

export const resendConfirmationSchema = z.object({
  email: z.email("Укажите почту"),
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

// Замечание Zod: что не так и в каком поле. Остальные поля зависят от code.
// В path имена полей и индексы массивов.
export const validationIssueSchema = z.looseObject({
  code: z.string(),
  path: z.array(z.union([z.string(), z.number().int().nonnegative()])),
  message: z.string(),
});

// Тело ошибки Nest. error — название статуса, его нет у 401 из guard и у 429.
// errors приходят только с 400, когда тело запроса не прошло схему.
export const apiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  message: z.string(),
  error: z.string().optional(),
  errors: z.array(validationIssueSchema).optional(),
});

export const specializationSchema = z.enum(
  Specialization,
  "Выберите специализацию",
);
export const gradeSchema = z.enum(Grade, "Выберите грейд");
export const skillLevelSchema = z.enum(SkillLevel);
export const skillVerificationSchema = z.enum(SkillVerification);
export const workFormatSchema = z.enum(WorkFormat, "Выберите формат работы");
export const invitationStatusSchema = z.enum(InvitationStatus);
export const searchStatusSchema = z.enum(SearchStatus);
export const resumeTemplateSchema = z.enum(ResumeTemplate);

// Оформление PDF-профиля выбирают при скачивании. Без параметра — Ditto.
export const resumePdfQuerySchema = z.object({
  template: resumeTemplateSchema.default(ResumeTemplate.Ditto),
});

export const profileSkillSchema = z.object({
  skillId: z.uuid(),
  slug: z.string(),
  title: z.string(),
  level: skillLevelSchema.nullable(),
  verification: skillVerificationSchema.nullable(),
  verifiedAt: z.iso.datetime().nullable(),
});

const linkField = z.string().trim().max(120, "Слишком длинная ссылка");

const resumeYearSchema = z
  .number("Укажите год")
  .int("Только целый год")
  .min(1950, "Год не раньше 1950")
  .max(2035, "Год не позже 2035");

// Пустой «по» в форме — "", на сервер уходит null: по настоящее время.
const optionalEndYearSchema = z
  .union([z.literal(""), resumeYearSchema])
  .nullable()
  .transform((value) => {
    return value === "" ? null : value;
  });

function yearsInOrder(entry: {
  fromYear: number;
  toYear: number | null;
}): boolean {
  return entry.toYear === null || entry.toYear >= entry.fromYear;
}

export const educationEntrySchema = z.object({
  school: z.string().max(80),
  program: z.string().max(80),
  fromYear: z.number().int().min(1950).max(2035),
  toYear: z.number().int().min(1950).max(2035).nullable(),
});

export const experienceEntrySchema = z.object({
  company: z.string().max(80),
  role: z.string().max(80),
  fromYear: z.number().int().min(1950).max(2035),
  toYear: z.number().int().min(1950).max(2035).nullable(),
  summary: z.string().max(280),
});

export const saveEducationEntrySchema = z
  .object({
    school: z
      .string()
      .trim()
      .min(1, "Укажите учебное заведение")
      .max(80, "Слишком длинное название"),
    program: z
      .string()
      .trim()
      .min(1, "Укажите программу")
      .max(80, "Слишком длинное название"),
    fromYear: resumeYearSchema,
    toYear: optionalEndYearSchema,
  })
  .refine(yearsInOrder, {
    message: "Год окончания не раньше начала",
    path: ["toYear"],
  });

export const saveExperienceEntrySchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(1, "Укажите компанию")
      .max(80, "Слишком длинное название"),
    role: z
      .string()
      .trim()
      .min(1, "Укажите должность")
      .max(80, "Слишком длинное название"),
    fromYear: resumeYearSchema,
    toYear: optionalEndYearSchema,
    summary: z
      .string()
      .trim()
      .min(1, "Коротко опишите, чем занимались")
      .max(280, "Слишком длинный текст"),
  })
  .refine(yearsInOrder, {
    message: "Год окончания не раньше начала",
    path: ["toYear"],
  });

export const candidateProfileSchema = z.object({
  displayName: z.string(),
  specialization: specializationSchema.nullable(),
  claimedGrade: gradeSchema.nullable(),
  fspId: z.string().max(64).nullable(),
  phone: z.string().max(40).nullable(),
  telegram: z.string().max(120).nullable(),
  github: z.string().max(120).nullable(),
  linkedin: z.string().max(120).nullable(),
  website: z.string().max(120).nullable(),
  softSkills: z.array(z.string()),
  // Ожидания кандидата: по ним подборка сверяет вилку и формат работодателя.
  desiredSalaryFrom: z.number().int().positive().nullable(),
  experienceYears: z.number().min(0).nullable(),
  education: z.array(educationEntrySchema),
  experience: z.array(experienceEntrySchema),
  workFormats: z.array(workFormatSchema),
  searchStatus: searchStatusSchema,
  showExperience: z.boolean(),
  showSalary: z.boolean(),
  showFsp: z.boolean(),
  showUnverifiedSkills: z.boolean(),
  listed: z.boolean(),
  // Итог теста. Меняет его только попытка, форма профиля их не шлёт.
  verifiedGrade: gradeSchema.nullable(),
  verifiedAt: z.iso.datetime().nullable(),
  assessmentScore: z.number().int().min(0).max(100).nullable(),
  nextGradeChangeAt: z.iso.datetime().nullable(),
  skills: z.array(profileSkillSchema),
});

// Пустое поле зарплаты в форме — "", на сервер уходит null.
const optionalSalarySchema = z
  .union([
    z.literal(""),
    z
      .number("Укажите сумму")
      .int("Только целые рубли")
      .positive("Сумма должна быть больше нуля"),
  ])
  .nullable()
  .transform((value) => {
    return value === "" ? null : value;
  });

// Пустое поле стажа в форме — "", на сервер уходит null.
const optionalYearsSchema = z
  .union([
    z.literal(""),
    z
      .number("Укажите стаж")
      .min(0, "Стаж не меньше нуля")
      .max(40, "Стаж не больше 40 лет"),
  ])
  .nullable()
  .transform((value) => {
    return value === "" ? null : value;
  });

export const saveContactsSchema = z.object({
  displayName: z.string().trim().min(1, "Укажите ФИО"),
  specialization: specializationSchema,
  claimedGrade: gradeSchema,
  fspId: z.string().trim().max(64, "Слишком длинный ID"),
  phone: z.string().trim().max(40, "Слишком длинный номер"),
  telegram: linkField,
  github: linkField,
  linkedin: linkField,
  website: linkField,
  softSkills: z
    .array(z.string().trim().min(1).max(60, "Слишком длинное качество"))
    .max(20, "Не больше 20 качеств"),
  desiredSalaryFrom: optionalSalarySchema,
  experienceYears: optionalYearsSchema,
  education: z.array(saveEducationEntrySchema).max(8),
  experience: z.array(saveExperienceEntrySchema).max(12),
  workFormats: z.array(workFormatSchema).max(3),
  searchStatus: searchStatusSchema,
  showExperience: z.boolean(),
  showSalary: z.boolean(),
  showFsp: z.boolean(),
  showUnverifiedSkills: z.boolean(),
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

// Черновик из текста резюме. В профиль не пишется, пока кандидат не сохранит форму.
export const resumeDraftSchema = z.object({
  displayName: z.string().max(80).nullable(),
  specialization: specializationSchema.nullable(),
  experienceYears: z.number().min(0).max(40).nullable(),
  claimedGrade: gradeSchema.nullable(),
  phone: z.string().max(40).nullable(),
  telegram: z.string().max(120).nullable(),
  github: z.string().max(120).nullable(),
  linkedin: z.string().max(120).nullable(),
  website: z.string().max(120).nullable(),
  desiredSalaryFrom: z.number().int().positive().nullable(),
  workFormats: z.array(workFormatSchema),
  searchStatus: searchStatusSchema.nullable(),
  skills: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
    }),
  ),
  softSkills: z.array(z.string()),
  // Год начала учёбы hh.ru не пишет, только год выпуска: тогда fromYear — null.
  education: z.array(
    educationEntrySchema.extend({
      fromYear: educationEntrySchema.shape.fromYear.nullable(),
    }),
  ),
  experience: z.array(experienceEntrySchema),
});

// Модель работодателя: профиль компании, потребности, подборка, приглашения.

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
  workFormats: z
    .array(workFormatSchema)
    .min(1, "Выберите хотя бы один формат работы")
    .max(3),
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

// Ответы API работодателя. Списки и «может не быть» завёрнуты в объект,
// чтобы DTO в Nest оставался обычной схемой-объектом.
export const companyResponseSchema = z.object({
  company: companyProfileSchema.nullable(),
});

// candidateCount — сколько кандидатов в подборке без отклонённых. Считает сервер.
export const hiringNeedSchema = z.object({
  ...hiringNeedShape,
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  candidateCount: z.number().int().min(0),
});

export const hiringNeedListSchema = z.object({
  items: z.array(hiringNeedSchema),
});

// Навык в форме profileSkillSchema плюс балл теста, если тест его оценил.
export const candidateSkillSchema = z.object({
  title: z.string(),
  level: skillLevelSchema.nullable(),
  verification: skillVerificationSchema,
  score: z.number().min(0).max(100).nullable(),
  verifiedAt: z.iso.datetime().nullable(),
});

// Достижение реестра ФСП: kind обязателен, level и organizer могут отсутствовать.
// По kind/level веб собирает подписи, ранжирователю нужны только title/year/place.
export const fspAchievementKindSchema = z.enum(FspAchievementKind);
export const fspAchievementLevelSchema = z.enum(FspAchievementLevel);
export const fspSportRankSchema = z.enum(FspSportRank);

export const fspAchievementSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  place: z.number().int().positive().nullable(),
  kind: fspAchievementKindSchema,
  level: fspAchievementLevelSchema.nullable(),
  // Без max конвертер выдаёт type:[string,null], а hey-api из такой схемы
  // делает unknown вместо string | null.
  organizer: z.string().max(200).nullable(),
});

// Участник реестра: личные данные плюс история выступлений.
export const fspParticipantSchema = z.object({
  fspId: z.string(),
  name: z.string(),
  sportRank: fspSportRankSchema.nullable(),
  rating: z.number().int().nullable(),
  achievements: z.array(fspAchievementSchema),
});

// Статус поиска по почте: нашли, не нашли или реестр сейчас недоступен.
export const fspLinkStatusSchema = z.enum([
  "found",
  "not-found",
  "unavailable",
]);

// Превью привязки для кандидата: что реестр знает о человеке с его почтой.
export const fspLinkPreviewSchema = z.object({
  status: fspLinkStatusSchema,
  participant: fspParticipantSchema.nullable(),
});

// Своя история ФСП: participant null, пока fspId не привязан или реестр не ответил.
export const fspHistorySchema = z.object({
  participant: fspParticipantSchema.nullable(),
});

export const candidatePreferencesSchema = z.object({
  desiredSalaryFrom: z.number().int().positive().nullable(),
  workFormats: z.array(workFormatSchema),
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
  experienceYears: z.number().min(0).nullable(),
  skills: z.array(candidateSkillSchema),
  assessmentScore: z.number().min(0).max(100).nullable(),
  profileFreshness: z.number().min(0).max(1).default(1),
  fspAchievements: z.array(fspAchievementSchema),
  preferences: candidatePreferencesSchema,
});

// Подтверждение от ФСП: история в реестре или навык, подтверждённый ФСП.
// Одно правило для фильтра поиска на сервере и уточнения подборки в вебе.
export function hasFspEvidence(candidate: {
  fspAchievements: unknown[];
  skills: { verification: SkillVerification }[];
}): boolean {
  return (
    candidate.fspAchievements.length > 0 ||
    candidate.skills.some((skill) => {
      return skill.verification === SkillVerification.VerifiedExternal;
    })
  );
}

// Поиск по банку кандидатов без потребности. Пустой фильтр не ограничивает.
// Навыки нужны все сразу, регистр не важен.
export const candidateSearchSchema = z.object({
  specialization: specializationSchema.nullable(),
  grades: z.array(gradeSchema),
  skills: skillListSchema,
  fspOnly: z.boolean(),
});

// Выдача ограничена: total — сколько подошло всего, items — первые candidateSearchLimit.
export const candidateSearchLimit = 50;

export const candidateSearchResultSchema = z.object({
  items: z.array(candidateSnapshotSchema),
  total: z.number().int().min(0),
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
  favorite: z.boolean(),
});

// Категория — специализация потребности и один подтверждённый грейд.
// exact — грейд в диапазоне потребности, adjacent — ступень вокруг, её подборка тоже берёт.
export const categoryMatchSchema = z.enum(["exact", "adjacent"]);

// candidateCount — кандидаты этой категории в подборке без отклонённых.
export const shortlistCategorySchema = z.object({
  grade: gradeSchema,
  match: categoryMatchSchema,
  candidateCount: z.number().int().min(0),
});

export const shortlistSchema = z.object({
  needId: z.string(),
  modelVersion: z.string(),
  categories: z.array(shortlistCategorySchema),
  items: z.array(matchSchema),
});

const invitationShape = {
  candidateId: z.uuid(),
  // У голого z.string().nullable() генератор OpenAPI ломает тип: держим ограничение.
  needId: z.uuid().nullable(),
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
  needTitle: z.string().min(1).nullable(),
  // Контакт кандидата раскрывается только после принятия приглашения.
  candidateContact: z.string().min(1).nullable(),
});

export const invitationListSchema = z.object({
  items: z.array(invitationSchema),
});

// Приглашение глазами кандидата: компания и условия, без алиаса и контакта кандидата.
export const candidateInvitationSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  companyIndustry: z.string(),
  needTitle: z.string().min(1).nullable(),
  message: z.string(),
  // Способ связи с работодателем. Его кандидат видит сразу, свой контакт — открывает принятием.
  contact: z.string(),
  ...salaryShape,
  status: invitationStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const candidateInvitationListSchema = z.object({
  items: z.array(candidateInvitationSchema),
});

// Отмечаем просмотренными только показанные: пришедшее после загрузки списка остаётся новым.
export const markInvitationsViewedSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export const attemptStatusSchema = z.enum(AttemptStatus);
export const integrityFlagSchema = z.enum(IntegrityFlag);

// Браузер сообщает только то, что видит сам. IP, агент и скорость ответа проверяет сервер.
export const clientIntegrityFlagSchema = z.enum([
  IntegrityFlag.TabHidden,
  IntegrityFlag.WindowBlur,
  IntegrityFlag.FullscreenExit,
  IntegrityFlag.FullscreenDenied,
  IntegrityFlag.Copy,
]);

export const assessmentItemKindSchema = z.enum([
  "single",
  "multiple",
  "numeric",
  "code",
  "order",
]);

export const codeLangSchema = z.enum([
  "typescript",
  "dockerfile",
  "sql",
  "python",
  "csharp",
  "go",
  "java",
  "tsx",
]);

export const startAssessmentSchema = z.object({
  grade: gradeSchema,
});

export const assessmentSectionSchema = z.object({
  skillId: z.uuid(),
  title: z.string(),
  count: z.number().int().positive(),
});

// Текст вопроса без ответа: верные индексы остаются на сервере.
export const assessmentItemSchema = z.object({
  itemId: z.string(),
  skillId: z.uuid(),
  kind: assessmentItemKindSchema,
  prompt: z.string(),
  code: z.string().max(4000).nullable(),
  lang: codeLangSchema.nullable(),
  choices: z.array(z.string()),
  seconds: z.number().int().positive(),
});

// item пустой до первого вопроса (план попытки) и после последнего, когда index === total.
export const activeAttemptSchema = z.object({
  attemptId: z.uuid(),
  grade: gradeSchema,
  sections: z.array(assessmentSectionSchema),
  index: z.number().int().min(0),
  total: z.number().int().positive(),
  item: assessmentItemSchema.nullable(),
  secondsLeft: z.number().int().min(0).max(3600).nullable(),
});

export const currentAttemptSchema = z.object({
  attempt: activeAttemptSchema.nullable(),
});

// choices: single и code — один индекс, multiple — набор, order — порядок шагов. value — для numeric.
export const answerAssessmentSchema = z.object({
  attemptId: z.uuid(),
  itemId: z.string().min(1),
  choices: z.array(z.number().int().nonnegative()).max(10),
  value: z.number().optional(),
});

export const assessmentEventsSchema = z.object({
  attemptId: z.uuid(),
  events: z
    .array(
      z.object({
        type: clientIntegrityFlagSchema,
        durationMs: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const assessmentEventsAcceptedSchema = z.object({
  accepted: z.number().int().min(0),
});

export const finishAssessmentSchema = z.object({
  attemptId: z.uuid(),
});

export const assessmentSectionResultSchema = z.object({
  skillId: z.uuid(),
  title: z.string(),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
});

export const flagCountSchema = z.object({
  type: integrityFlagSchema,
  count: z.number().int().positive(),
});

export const assessmentResultSchema = z.object({
  attemptId: z.uuid(),
  status: attemptStatusSchema,
  score: z.number().int().min(0).max(100),
  grade: gradeSchema,
  integrity: z.number().int().min(0).max(100),
  flags: z.array(flagCountSchema),
  sections: z.array(assessmentSectionResultSchema),
  gradeChanged: z.boolean(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
});

export const assessmentHistorySchema = z.object({
  items: z.array(assessmentResultSchema),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Health = z.infer<typeof healthSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
export type ResumeDraft = z.infer<typeof resumeDraftSchema>;
export type ResumePdfQuery = z.infer<typeof resumePdfQuerySchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type HiringNeedInput = z.infer<typeof hiringNeedInputSchema>;
export type HiringNeed = z.infer<typeof hiringNeedSchema>;
export type CompanyResponse = z.infer<typeof companyResponseSchema>;
export type HiringNeedList = z.infer<typeof hiringNeedListSchema>;
export type CandidateSkill = z.infer<typeof candidateSkillSchema>;
export type FspAchievement = z.infer<typeof fspAchievementSchema>;
export type FspParticipant = z.infer<typeof fspParticipantSchema>;
export type FspLinkStatus = z.infer<typeof fspLinkStatusSchema>;
export type FspLinkPreview = z.infer<typeof fspLinkPreviewSchema>;
export type FspHistory = z.infer<typeof fspHistorySchema>;
export type CandidatePreferences = z.infer<typeof candidatePreferencesSchema>;
export type CandidateSnapshot = z.infer<typeof candidateSnapshotSchema>;
export type CandidateSearch = z.infer<typeof candidateSearchSchema>;
export type CandidateSearchResult = z.infer<typeof candidateSearchResultSchema>;
export type MatchGroup = z.infer<typeof matchGroupSchema>;
export type MatchBreakdown = z.infer<typeof matchBreakdownSchema>;
export type Match = z.infer<typeof matchSchema>;
export type CategoryMatch = z.infer<typeof categoryMatchSchema>;
export type ShortlistCategory = z.infer<typeof shortlistCategorySchema>;
export type Shortlist = z.infer<typeof shortlistSchema>;
export type InvitationInput = z.infer<typeof invitationInputSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
export type InvitationList = z.infer<typeof invitationListSchema>;
export type CandidateInvitation = z.infer<typeof candidateInvitationSchema>;
export type CandidateInvitationList = z.infer<
  typeof candidateInvitationListSchema
>;
export type MarkInvitationsViewedInput = z.infer<
  typeof markInvitationsViewedSchema
>;
export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;
export type AssessmentItem = z.infer<typeof assessmentItemSchema>;
export type ActiveAttempt = z.infer<typeof activeAttemptSchema>;
export type CurrentAttempt = z.infer<typeof currentAttemptSchema>;
export type AnswerAssessmentInput = z.infer<typeof answerAssessmentSchema>;
export type AssessmentEventsInput = z.infer<typeof assessmentEventsSchema>;
export type FinishAssessmentInput = z.infer<typeof finishAssessmentSchema>;
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
export type AssessmentHistory = z.infer<typeof assessmentHistorySchema>;
