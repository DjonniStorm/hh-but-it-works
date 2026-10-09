import { type FspAchievement, formatSalaryFrom } from "@hh/contracts";
import { type Grade, type SkillLevel, SkillVerification } from "@hh/types";

import type { CandidateProfile } from "../candidate-profile.entity";
import type { CandidateSkill } from "../candidate-skill.entity";
import { type ResumeContact, contactsOf } from "./contacts";
import {
  gradeLabel,
  levelRank,
  phrase,
  searchStatusLabel,
  specializationRole,
  text,
  workFormatLabel,
} from "./theme";

export enum SkillSource {
  Test = "test",
  Fsp = "fsp",
}

export const skillSourceLabel: Record<SkillSource, string> = {
  [SkillSource.Test]: "ТЕСТ",
  [SkillSource.Fsp]: "ФСП",
};

export type ResumeSkill = {
  title: string;
  level: SkillLevel;
  source: SkillSource | null;
  verifiedAt: Date | null;
};

// Одна запись в разделе: достижение ФСП сейчас, позже — место работы или учёбы.
export type ResumeEntry = {
  title: string;
  subtitle: string | null;
  period: string;
  details: string[];
};

export type ResumeFact = { label: string; value: string };

export type ResumeQualification = {
  claimed: Grade;
  verified: Grade | null;
  score: number | null;
  verifiedAt: Date | null;
};

export type ResumeData = {
  name: string;
  initials: string;
  headline: string;
  summary: string;
  qualification: ResumeQualification;
  contacts: ResumeContact[];
  skills: ResumeSkill[];
  facts: ResumeFact[];
  // В анкете опыта и образования пока нет. Раскладки их уже рисуют, когда список не пуст.
  experience: ResumeEntry[];
  education: ResumeEntry[];
  achievements: ResumeEntry[];
  generatedAt: Date;
};

export type ResumeSource = {
  profile: CandidateProfile;
  skills: { title: string; row: CandidateSkill }[];
  email: string | null;
  achievements: FspAchievement[];
};

const sourceOf: Record<SkillVerification, SkillSource | null> = {
  [SkillVerification.Verified]: SkillSource.Test,
  [SkillVerification.VerifiedExternal]: SkillSource.Fsp,
  [SkillVerification.Unverified]: null,
};

// Флаги show* значат одно и то же в подборке и в PDF: скрытое кандидатом не печатаем.
export function buildResume(source: ResumeSource): ResumeData {
  const { profile } = source;
  const name = profile.displayName.trim() || text.noName;
  const skills = visibleSkills(source);
  const experienceYears = profile.showExperience
    ? profile.experienceYears
    : null;
  const achievements = profile.showFsp ? achievementEntries(source) : [];
  const grade = profile.verifiedGrade ?? profile.claimedGrade;
  return {
    name,
    initials: initialsOf(profile.displayName),
    headline: `${specializationRole[profile.specialization]} · ${gradeLabel[grade]}`,
    summary: summaryOf(profile, experienceYears, skills, achievements),
    qualification: {
      claimed: profile.claimedGrade,
      verified: profile.verifiedGrade,
      score: profile.verifiedGrade ? profile.assessmentScore : null,
      verifiedAt: profile.verifiedGrade ? profile.verifiedAt : null,
    },
    contacts: contactsOf(profile, source.email),
    skills,
    facts: factsOf(profile, experienceYears),
    experience: [],
    education: [],
    achievements,
    generatedAt: new Date(),
  };
}

function visibleSkills(source: ResumeSource): ResumeSkill[] {
  return source.skills
    .flatMap(({ title, row }) => {
      const skillSource = sourceOf[row.verification];
      if (
        !row.level ||
        (!skillSource && !source.profile.showUnverifiedSkills)
      ) {
        return [];
      }
      return [
        {
          title,
          level: row.level,
          source: skillSource,
          verifiedAt: skillSource ? row.verifiedAt : null,
        },
      ];
    })
    .sort((left, right) => {
      // Подтверждённые выше, внутри — от сильного уровня к базовому.
      const verified = Number(!!right.source) - Number(!!left.source);
      const level = levelRank[right.level] - levelRank[left.level];
      return verified || level || left.title.localeCompare(right.title, "ru");
    });
}

function achievementEntries(source: ResumeSource): ResumeEntry[] {
  return [...source.achievements]
    .sort((left, right) => {
      return right.year - left.year;
    })
    .map((item) => {
      return {
        title: item.title,
        subtitle: item.place ? `${item.place} ${text.place}` : text.participant,
        period: String(item.year),
        details: [],
      };
    });
}

function factsOf(
  profile: CandidateProfile,
  experienceYears: number | null,
): ResumeFact[] {
  const facts: ResumeFact[] = [];
  if (experienceYears !== null) {
    facts.push({ label: text.experience, value: formatYears(experienceYears) });
  }
  if (profile.workFormats.length > 0) {
    const formats = profile.workFormats.map((format) => {
      return workFormatLabel[format];
    });
    facts.push({ label: text.formats, value: formats.join(", ") });
  }
  if (profile.showSalary && profile.desiredSalaryFrom) {
    facts.push({
      label: text.salary,
      value: formatSalaryFrom(profile.desiredSalaryFrom),
    });
  }
  const status = searchStatusLabel[profile.searchStatus];
  if (status) {
    facts.push({ label: text.status, value: status });
  }
  return facts;
}

function summaryOf(
  profile: CandidateProfile,
  experienceYears: number | null,
  skills: ResumeSkill[],
  achievements: ResumeEntry[],
): string {
  const grade = gradeLabel[profile.verifiedGrade ?? profile.claimedGrade];
  const parts = [
    phrase.role(specializationRole[profile.specialization], grade),
  ];
  if (!profile.verifiedGrade) {
    parts.push(phrase.gradeClaimed);
  } else {
    parts.push(
      profile.assessmentScore === null
        ? phrase.gradeVerified
        : phrase.gradeScored(profile.assessmentScore),
    );
  }
  if (experienceYears !== null) {
    parts.push(phrase.experience(formatYears(experienceYears)));
  }
  const verified = skills.filter((skill) => {
    return skill.source;
  }).length;
  if (verified > 0) {
    parts.push(phrase.verifiedSkills(verified));
  }
  if (achievements.length > 0) {
    parts.push(phrase.achievements(achievements.length));
  }
  return parts.join(" ");
}

// Фото в анкете нет: на его месте квадрат с инициалами.
function initialsOf(displayName: string): string {
  const letters = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => {
      return word[0]?.toUpperCase() ?? "";
    });
  return letters.join("") || "—";
}

// Та же форма, что formatYears на вебе: дробное число — «года».
export function formatYears(value: number): string {
  const shown = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
  }).format(value);
  if (!Number.isInteger(value)) {
    return `${shown} года`;
  }
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${shown} лет`;
  }
  if (last === 1) {
    return `${shown} год`;
  }
  if (last >= 2 && last <= 4) {
    return `${shown} года`;
  }
  return `${shown} лет`;
}
