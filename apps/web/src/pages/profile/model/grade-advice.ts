import type { CandidateProfile } from "@hh/contracts";
import { Grade, gradeIndex, gradeOrder } from "@hh/types";

import { confidentScore, formatDate } from "./attempt";
import { gradeOptions, optionLabel } from "./options";

function label(grade: Grade | null): string {
  return optionLabel(gradeOptions, grade) ?? "—";
}

// Пока идёт пауза, тест доступен только на подтверждённый грейд.
export function allowedGrades(profile: CandidateProfile): Grade[] {
  if (profile.verifiedGrade && profile.nextGradeChangeAt) {
    return [profile.verifiedGrade];
  }
  return [...gradeOrder];
}

export function defaultTestGrade(profile: CandidateProfile): Grade {
  return profile.verifiedGrade ?? profile.claimedGrade ?? Grade.Junior;
}

export function gradeAdvice(profile: CandidateProfile): string[] {
  const verified = profile.verifiedGrade;
  if (!verified) {
    return [
      `Грейд пока не подтверждён. Начните с заявленного: ${label(profile.claimedGrade)}.`,
      "Не получилось — грейд не понижается, можно сдать тест на уровень ниже.",
    ];
  }
  const advice = [
    `Подтверждён ${label(verified)}, балл ${profile.assessmentScore ?? "—"}.`,
  ];
  if (profile.nextGradeChangeAt) {
    advice.push(
      `Сменить грейд можно с ${formatDate(profile.nextGradeChangeAt)}. До этого доступна пересдача на ${label(verified)}: она обновит балл и навыки.`,
    );
  } else {
    advice.push("Пауза прошла: можно сдать тест на любой грейд.");
  }
  const next = gradeOrder[gradeIndex(verified) + 1];
  if (next && (profile.assessmentScore ?? 0) >= confidentScore) {
    advice.push(
      `Результат уверенный: попробуйте ${label(next)}${profile.nextGradeChangeAt ? ` после ${formatDate(profile.nextGradeChangeAt)}` : ""}.`,
    );
  }
  return advice;
}
