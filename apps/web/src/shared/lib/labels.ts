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

export const specializationOptions = enumOptions(specializationLabel);
export const gradeOptions = gradeOrder.map((grade) => {
  return { value: grade, label: gradeLabel[grade] };
});
export const workFormatOptions = enumOptions(workFormatLabel);

function enumOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => {
    return { value, label: labels[value] };
  });
}
