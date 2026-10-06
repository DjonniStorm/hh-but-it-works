import type { CandidateProfile } from "@hh/contracts";
import {
  Grade,
  SkillLevel,
  SkillVerification,
  Specialization,
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
  listed: boolean;
  skills: {
    skillId: string;
    slug: string;
    title: string;
    level: string | null;
    verification: string | null;
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
    listed: profile.listed,
    skills: profile.skills.map((skill) => {
      return {
        skillId: skill.skillId,
        slug: skill.slug,
        title: skill.title,
        level: mapSkillLevel(skill.level),
        verification: mapVerification(skill.verification),
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
