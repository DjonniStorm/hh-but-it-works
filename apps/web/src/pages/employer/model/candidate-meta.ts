import { formatYears } from "@/shared/lib/format";
import { workFormatLabel } from "@/shared/lib/labels";

import { type CandidateSnapshot, formatSalaryFrom } from "@hh/contracts";

// «3,5 года опыта · от 220 000 ₽ · Удалённо». Пустое кандидат мог не заполнить — пропускаем.
export function candidateMeta(candidate: CandidateSnapshot): string {
  const { experienceYears, preferences } = candidate;
  const parts = [
    experienceYears === null ? null : `${formatYears(experienceYears)} опыта`,
    preferences.desiredSalaryFrom === null
      ? null
      : formatSalaryFrom(preferences.desiredSalaryFrom),
    preferences.workFormats
      .map((format) => {
        return workFormatLabel[format];
      })
      .join(", ") || null,
  ];
  return (
    parts
      .filter((part) => {
        return part !== null;
      })
      .join(" · ") || "Ожидания не указаны"
  );
}
