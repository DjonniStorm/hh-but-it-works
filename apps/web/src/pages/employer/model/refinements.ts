import type { Match } from "@hh/contracts";
import { SkillVerification } from "@hh/types";

export type Refinement = "verified" | "fsp" | "assessment";

export const refinementLabel: Record<Refinement, string> = {
  verified: "Только подтверждённый грейд",
  fsp: "Есть достижения ФСП",
  assessment: "Тест от 80 баллов",
};

export const refinementKeys = Object.keys(refinementLabel) as Refinement[];

// Уточнения работают поверх уже полученной подборки и не перезапрашивают её.
const refinementCheck: Record<Refinement, (match: Match) => boolean> = {
  verified: (match) => {
    return match.candidate.verifiedGrade !== null;
  },
  fsp: (match) => {
    return (
      match.candidate.fspAchievements.length > 0 ||
      match.candidate.skills.some((skill) => {
        return skill.verification === SkillVerification.VerifiedExternal;
      })
    );
  },
  assessment: (match) => {
    return (match.candidate.assessmentScore ?? 0) >= 80;
  },
};

export function applyRefinements(
  matches: Match[],
  refinements: Refinement[],
): Match[] {
  return matches.filter((match) => {
    return refinements.every((key) => {
      return refinementCheck[key](match);
    });
  });
}
