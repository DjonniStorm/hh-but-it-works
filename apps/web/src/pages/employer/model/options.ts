import { Specialization, skillCatalog } from "@hh/types";

export const industryOptions = [
  "Финтех",
  "E-commerce",
  "Госсектор",
  "Телеком",
  "EdTech",
  "HealthTech",
  "Игры",
  "B2B SaaS",
  "Промышленность",
  "Другое",
];

function isSpecialization(value: string): value is Specialization {
  return Object.values(Specialization).includes(value as Specialization);
}

// Подсказки TagsInput: каталог выбранной специализации. Свой навык вводится с клавиатуры.
export function skillSuggestionsFor(specialization: string | null): string[] {
  const rows =
    specialization && isSpecialization(specialization)
      ? skillCatalog.filter((skill) => {
          return skill.specializations.includes(specialization);
        })
      : skillCatalog;
  return rows.map((skill) => {
    return skill.title;
  });
}
