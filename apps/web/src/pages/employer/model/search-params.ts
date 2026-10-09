import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import type { CandidateSearch } from "@hh/contracts";
import { Specialization, gradeOrder } from "@hh/types";

// Фильтры поиска живут в адресе: выдачу можно обновить, вернуться к ней «Назад» и переслать.
export const searchParsers = {
  specialization: parseAsStringLiteral(Object.values(Specialization)),
  grades: parseAsArrayOf(parseAsStringLiteral(gradeOrder)).withDefault([]),
  skills: parseAsArrayOf(parseAsString).withDefault([]),
  fsp: parseAsBoolean.withDefault(false),
};

export type SearchParams = {
  specialization: Specialization | null;
  grades: CandidateSearch["grades"];
  skills: string[];
  fsp: boolean;
};

// Схема запроса не пускает повтор навыка без учёта регистра и больше 10 навыков.
// Адрес могли поправить руками, поэтому чистим его до запроса.
export const searchSkillLimit = 10;

export function toSearchFilter(params: SearchParams): CandidateSearch {
  const seen = new Set<string>();
  const skills = params.skills.reduce<string[]>((acc, raw) => {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (skill && !seen.has(key) && acc.length < searchSkillLimit) {
      seen.add(key);
      acc.push(skill);
    }
    return acc;
  }, []);
  return {
    specialization: params.specialization,
    grades: params.grades,
    skills,
    fspOnly: params.fsp,
  };
}
