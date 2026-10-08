import type { ResumeDraft } from "@hh/contracts";
import type { SkillLevel, SkillVerification } from "@hh/types";

export type ResumeDraftHit = {
  at: number;
  draft: ResumeDraft;
};

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
  experienceYears: number | "";
  workFormats: string[];
  searchStatus: string;
  showExperience: boolean;
  showSalary: boolean;
  showFsp: boolean;
  showUnverifiedSkills: boolean;
};

export type SkillsFormValues = {
  skills: SkillRow[];
};
