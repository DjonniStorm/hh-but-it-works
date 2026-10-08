import { type Match, hasFspEvidence } from "@hh/contracts";

export type Refinement = "verified" | "fsp" | "assessment" | "favorites";

export const refinementLabel: Record<Refinement, string> = {
  verified: "Только подтверждённый грейд",
  fsp: "Есть достижения ФСП",
  assessment: "Тест от 80 баллов",
  favorites: "Только избранные",
};

export const refinementKeys = Object.keys(refinementLabel) as Refinement[];

// Уточнения работают поверх уже полученной подборки и не перезапрашивают её.
const refinementCheck: Record<Refinement, (match: Match) => boolean> = {
  verified: (match) => {
    return match.candidate.verifiedGrade !== null;
  },
  fsp: (match) => {
    return hasFspEvidence(match.candidate);
  },
  assessment: (match) => {
    return (match.candidate.assessmentScore ?? 0) >= 80;
  },
  favorites: (match) => {
    return match.favorite;
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
