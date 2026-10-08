import type { CandidateProfile } from "@hh/contracts";
import {
  Grade,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
  WorkFormat,
} from "@hh/types";

export function mapCandidateProfile(profile: {
  displayName: string;
  specialization: string | null;
  claimedGrade: string | null;
  fspId: string | null;
  telegram: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  desiredSalaryFrom: number | null;
  workFormats: string[];
  searchStatus: string;
  showExperience: boolean;
  showSalary: boolean;
  showFsp: boolean;
  showUnverifiedSkills: boolean;
  listed: boolean;
  verifiedGrade: string | null;
  verifiedAt: string | null;
  assessmentScore: number | null;
  nextGradeChangeAt: string | null;
  skills: {
    skillId: string;
    slug: string;
    title: string;
    level: string | null;
    verification: string | null;
    verifiedAt: string | null;
  }[];
}): CandidateProfile {
  return {
    displayName: profile.displayName,
    specialization: mapSpecialization(profile.specialization),
    claimedGrade: mapGrade(profile.claimedGrade),
    fspId: profile.fspId,
    telegram: profile.telegram,
    github: profile.github,
    linkedin: profile.linkedin,
    website: profile.website,
    desiredSalaryFrom: profile.desiredSalaryFrom,
    workFormats: profile.workFormats.map(mapWorkFormat),
    searchStatus: mapSearchStatus(profile.searchStatus),
    showExperience: profile.showExperience,
    showSalary: profile.showSalary,
    showFsp: profile.showFsp,
    showUnverifiedSkills: profile.showUnverifiedSkills,
    listed: profile.listed,
    verifiedGrade: mapGrade(profile.verifiedGrade),
    verifiedAt: profile.verifiedAt,
    assessmentScore: profile.assessmentScore,
    nextGradeChangeAt: profile.nextGradeChangeAt,
    skills: profile.skills.map((skill) => {
      return {
        skillId: skill.skillId,
        slug: skill.slug,
        title: skill.title,
        level: mapSkillLevel(skill.level),
        verification: mapVerification(skill.verification),
        verifiedAt: skill.verifiedAt,
      };
    }),
  };
}

function mapSpecialization(value: string | null): Specialization | null {
  if (value === null) {
    return null;
  }
  if (
    value === Specialization.Backend ||
    value === Specialization.Frontend ||
    value === Specialization.Data ||
    value === Specialization.Security
  ) {
    return value;
  }
  throw new Error("Неизвестная специализация");
}

function mapGrade(value: string | null): Grade | null {
  if (value === null) {
    return null;
  }
  if (
    value === Grade.Junior ||
    value === Grade.Middle ||
    value === Grade.Senior
  ) {
    return value;
  }
  throw new Error("Неизвестный грейд");
}

function mapVerification(value: string | null): SkillVerification | null {
  if (value === null) {
    return null;
  }
  if (
    value === SkillVerification.Unverified ||
    value === SkillVerification.Verified ||
    value === SkillVerification.VerifiedExternal
  ) {
    return value;
  }
  throw new Error("Неизвестный статус навыка");
}

function mapWorkFormat(value: string): WorkFormat {
  if (
    value === WorkFormat.Office ||
    value === WorkFormat.Hybrid ||
    value === WorkFormat.Remote
  ) {
    return value;
  }
  throw new Error("Неизвестный формат работы");
}

function mapSearchStatus(value: string): SearchStatus {
  if (
    value === SearchStatus.ActivelyLooking ||
    value === SearchStatus.OpenToOffers ||
    value === SearchStatus.Hidden
  ) {
    return value;
  }
  throw new Error("Неизвестный статус поиска");
}

function mapSkillLevel(value: string | null): SkillLevel | null {
  if (value === null) {
    return null;
  }
  if (
    value === SkillLevel.Basic ||
    value === SkillLevel.Confident ||
    value === SkillLevel.Strong
  ) {
    return value;
  }
  throw new Error("Неизвестный уровень навыка");
}
