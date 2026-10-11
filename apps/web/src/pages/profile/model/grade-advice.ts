import type { CandidateProfile } from "@hh/contracts";
import { Grade, gradeIndex, gradeOrder } from "@hh/types";

import { confidentScore, formatDate } from "./attempt";
import { gradeOptions, optionLabel } from "./options";

function label(grade: Grade | null): string {
  return optionLabel(gradeOptions, grade) ?? "—";
}

// Пока идёт пауза, тест доступен только на грейд, на котором она держится.
export function allowedGrades(profile: CandidateProfile): Grade[] {
  if (profile.lockedGrade) {
    return [profile.lockedGrade];
  }
  return [...gradeOrder];
}

export function defaultTestGrade(profile: CandidateProfile): Grade {
  return (
    profile.lockedGrade ??
    profile.verifiedGrade ??
    profile.claimedGrade ??
    Grade.Junior
  );
}

// Почему в лобби один грейд и когда откроются остальные.
export function lockNote(profile: CandidateProfile): string | null {
  const locked = profile.lockedGrade;
  if (!locked || !profile.nextGradeChangeAt) {
    return null;
  }
  const until = formatDate(profile.nextGradeChangeAt);
  const retake = profile.verifiedGrade
    ? " Пересдача обновит балл и навыки, грейд не понизит."
    : "";
  const note = `До ${until} тест только на ${label(locked)}: грейд меняется не чаще раза в три месяца.${retake}`;
  if (profile.claimedGrade && profile.claimedGrade !== locked) {
    return `${note} Заявленный ${label(profile.claimedGrade)} можно проверить тестом с ${until}.`;
  }
  return note;
}

// Заявленный грейд в анкете не трогает подтверждённый: тот меняет только тест.
export function claimNote(profile: CandidateProfile): string | null {
  if (!profile.verifiedGrade) {
    return null;
  }
  const after = profile.nextGradeChangeAt
    ? `, не раньше ${formatDate(profile.nextGradeChangeAt)}`
    : "";
  return `Подтверждён ${label(profile.verifiedGrade)}. Заявленный грейд его не меняет: подтверждённый сменит только тест${after}.`;
}

export function gradeAdvice(profile: CandidateProfile): string[] {
  const verified = profile.verifiedGrade;
  // Специализацию сменили во время паузы: грейд не подтверждён, но тест пока только на прежний.
  if (!verified && profile.lockedGrade && profile.nextGradeChangeAt) {
    return [
      "Грейд в этой специализации пока не подтверждён.",
      `До ${formatDate(profile.nextGradeChangeAt)} тест только на ${label(profile.lockedGrade)}: грейд меняется не чаще раза в три месяца.`,
    ];
  }
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
