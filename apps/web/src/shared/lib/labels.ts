import type { MatchGroup } from "@hh/contracts";
import {
  Grade,
  InvitationStatus,
  SearchStatus,
  SkillVerification,
  Specialization,
  WorkFormat,
  gradeOrder,
} from "@hh/types";

// Тексты совпадают с pages/profile/model/options.ts, чтобы кабинеты говорили одинаково.
export const specializationLabel: Record<Specialization, string> = {
  [Specialization.Backend]: "Бэкенд",
  [Specialization.Frontend]: "Фронтенд",
  [Specialization.Data]: "Данные",
  [Specialization.Security]: "Информационная безопасность",
};

export const gradeLabel: Record<Grade, string> = {
  [Grade.Junior]: "Junior",
  [Grade.Middle]: "Middle",
  [Grade.Senior]: "Senior",
};

export const workFormatLabel: Record<WorkFormat, string> = {
  [WorkFormat.Office]: "Офис",
  [WorkFormat.Hybrid]: "Гибрид",
  [WorkFormat.Remote]: "Удалённо",
};

export const invitationStatusLabel: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "Отправлено",
  [InvitationStatus.Viewed]: "Просмотрено",
  [InvitationStatus.Accepted]: "Принято",
  [InvitationStatus.Declined]: "Отклонено",
};

export const verificationLabel: Record<SkillVerification, string> = {
  [SkillVerification.Unverified]: "не подтверждён",
  [SkillVerification.Verified]: "тест",
  [SkillVerification.VerifiedExternal]: "ФСП",
};

export const searchStatusLabel: Record<SearchStatus, string> = {
  [SearchStatus.ActivelyLooking]: "Активно ищет",
  [SearchStatus.OpenToOffers]: "Открыт к предложениям",
  [SearchStatus.Hidden]: "Скрыт",
};

export const matchGroupLabel: Record<MatchGroup, string> = {
  category: "Специализация и грейд",
  skills: "Навыки и подтверждения",
  assessment: "Тестирование",
  fsp: "Достижения ФСП",
  preferences: "Условия и ожидания",
};

// Коды apps/ranking: «Почему подходит» и «риски» приходят оттуда.
const reasonLabel: Record<string, string> = {
  verified_grade_match: "Подтверждённый грейд подходит",
  strong_assessment: "Сильный результат тестирования",
  salary_full_match: "Зарплатные ожидания совпадают",
  work_mode_match: "Формат работы совпадает",
  fsp_evidence_present: "Есть подтверждение достижениями ФСП",
  grade_not_verified: "Грейд пока не подтверждён",
  grade_mismatch: "Грейд вне целевого диапазона",
  assessment_missing: "Нет результата тестирования",
  salary_weak_match: "Зарплатные ожидания совпадают слабо",
  profile_stale: "Профиль давно не обновлялся",
  candidate_hidden: "Кандидат скрыл профиль",
  specialization_mismatch: "Специализация не совпадает",
  grade_below_minimum: "Грейд ниже минимального",
  salary_incompatible: "Ожидания выше бюджета потребности",
  work_mode_incompatible: "Формат работы не подходит",
  location_incompatible: "Локация не подходит",
  critical_must_skill_missing: "Нет критически важного навыка",
};

// Коды с названием навыка после двоеточия.
const reasonWithArgument: Record<string, string> = {
  skill_missing: "Навык отсутствует",
  skill_not_verified: "Навык не подтверждён",
  strong_competency: "Сильная тема теста",
  semantic_overlap: "Опыт пересекается с задачами",
};

// Новый код от ранжирователя не должен пропасть из карточки, поэтому
// неизвестное имя отдаём как есть.
export function reasonText(code: string): string {
  const exact = reasonLabel[code];
  if (exact !== undefined) {
    return exact;
  }
  const mustSkills = /^must_skills_(\d+)_of_(\d+)$/.exec(code);
  if (mustSkills) {
    return `${mustSkills[1]} из ${mustSkills[2]} обязательных технологий в профиле`;
  }
  const [name, argument] = code.split(":");
  const pattern = reasonWithArgument[name];
  if (argument !== undefined && pattern !== undefined) {
    return `${pattern}: ${argument}`;
  }
  return code;
}

export const specializationOptions = enumOptions(specializationLabel);
export const gradeOptions = gradeOrder.map((grade) => {
  return { value: grade, label: gradeLabel[grade] };
});
export const workFormatOptions = enumOptions(workFormatLabel);
export const searchStatusOptions = enumOptions(searchStatusLabel);

function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => {
    return { value, label: labels[value] };
  });
}
