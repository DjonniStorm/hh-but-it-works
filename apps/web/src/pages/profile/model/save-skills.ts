import type { CandidateProfile, SaveProfileInput } from "@hh/contracts";

import type { SkillRow } from "./types";

export function assessedFromProfile(
  skills: CandidateProfile["skills"],
): SkillRow[] {
  return skills.flatMap((skill) => {
    if (!skill.level) {
      return [];
    }
    return [
      {
        skillId: skill.skillId,
        title: skill.title,
        level: skill.level,
        verification: skill.verification,
      },
    ];
  });
}

export function saveSkills(skills: SkillRow[]): SaveProfileInput["skills"] {
  return skills.map((skill) => {
    const level = skill.level ? skill.level : null;
    if (skill.skillId) {
      return { skillId: skill.skillId, level };
    }
    return { title: skill.title, level };
  });
}
