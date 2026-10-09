import type {
  ActiveAttemptDtoOutput,
  AssessmentHistoryDtoOutput,
  AssessmentResultDtoOutput,
} from "@/shared/api/generated/types.gen";

import { AttemptStatus, IntegrityFlag } from "@hh/types";

import type { FullscreenPause } from "./use-integrity-watch";

export type ActiveAttempt = ActiveAttemptDtoOutput;
export type AttemptItem = NonNullable<ActiveAttempt["item"]>;
export type AttemptResult = AssessmentResultDtoOutput;
export type AttemptHistory = AssessmentHistoryDtoOutput;

export type Draft = {
  choices: number[];
  value: number | null;
};

export const emptyDraft: Draft = { choices: [], value: null };

export const sectionPassScore = 70;
export const attemptPassScore = 70;
export const sectionFloorScore = 50;
export const confidentScore = 90;
export const annulBelow = 40;

export const flagLabels: Record<IntegrityFlag, string> = {
  [IntegrityFlag.TabHidden]: "Уход на другую вкладку",
  [IntegrityFlag.WindowBlur]: "Переход в другое окно",
  [IntegrityFlag.FullscreenExit]: "Выход из полноэкранного режима",
  [IntegrityFlag.FullscreenDenied]: "Полноэкранный режим не включён",
  [IntegrityFlag.Copy]: "Попытка скопировать текст",
  [IntegrityFlag.IpChange]: "Смена IP-адреса",
  [IntegrityFlag.AgentChange]: "Смена браузера",
  [IntegrityFlag.FastAnswer]: "Слишком быстрый ответ",
};

export const pauseTexts: Record<FullscreenPause, string> = {
  exited:
    "Вы вышли из полноэкранного режима, это записано. Таймер идёт. Вернитесь, чтобы видеть вопрос.",
  off: "Тест идёт в полноэкранном режиме. Таймер идёт. Включите его, чтобы видеть вопрос.",
};

export const statusLabels: Record<AttemptStatus, string> = {
  [AttemptStatus.Passed]: "Сдано",
  [AttemptStatus.Failed]: "Не сдано",
  [AttemptStatus.Annulled]: "Аннулировано",
};

export const statusColors: Record<AttemptStatus, string> = {
  [AttemptStatus.Passed]: "fsp",
  [AttemptStatus.Failed]: "gray",
  [AttemptStatus.Annulled]: "fspRed",
};

export function isFinished(attempt: ActiveAttempt): boolean {
  return attempt.index >= attempt.total;
}

// Номер секции текущего вопроса: вопросы идут секциями подряд.
export function sectionIndexOf(attempt: ActiveAttempt): number {
  let passed = 0;
  for (const [index, section] of attempt.sections.entries()) {
    passed += section.count;
    if (attempt.index < passed) {
      return index;
    }
  }
  return attempt.sections.length - 1;
}

export function totalMinutes(sections: ActiveAttempt["sections"]): number {
  const questions = sections.reduce((sum, section) => {
    return sum + section.count;
  }, 0);
  // В среднем полторы минуты на вопрос: точный лимит у каждого свой.
  return Math.ceil(questions * 1.5);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU");
}
