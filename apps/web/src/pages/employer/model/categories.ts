import type { CategoryMatch, Match } from "@hh/contracts";
import type { Grade } from "@hh/types";

export const categoryMatchLabel: Record<CategoryMatch, string> = {
  exact: "по запросу",
  adjacent: "соседний грейд",
};

// Выбранные категории сужают подборку до этих грейдов. Ничего не выбрано — все категории.
export function inCategories(matches: Match[], grades: Grade[]): Match[] {
  if (grades.length === 0) {
    return matches;
  }
  return matches.filter((match) => {
    const grade = match.candidate.verifiedGrade;
    return grade !== null && grades.includes(grade);
  });
}
