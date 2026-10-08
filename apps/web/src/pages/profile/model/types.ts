import type { SkillLevel, SkillVerification } from "@hh/types";

export type SkillRow = {
  skillId?: string;
  title: string;
  level: SkillLevel | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
};

export type ContactValues = {
  displayName: string;
  specialization: string;
  claimedGrade: string;
  fspId: string;
  telegram: string;
  github: string;
  linkedin: string;
  website: string;
  // Пустое поле NumberInput — "". Схема переводит его в null.
  desiredSalaryFrom: number | "";
  workFormats: string[];
  searchStatus: string;
};

export type SkillsFormValues = {
  skills: SkillRow[];
};
