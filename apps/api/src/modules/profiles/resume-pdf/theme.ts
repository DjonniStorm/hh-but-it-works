import { type RGB, rgb } from "pdf-lib";

import {
  Grade,
  SearchStatus,
  SkillLevel,
  Specialization,
  WorkFormat,
} from "@hh/types";

function hex(value: string): RGB {
  const n = Number.parseInt(value.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// Палитра ФСП: графит #1B1C21 и красный #EC1D35, остальное — их оттенки.
export const palette = {
  ink: hex("#1B1C21"),
  accent: hex("#EC1D35"),
  muted: hex("#5F6067"),
  faint: hex("#9A9BA1"),
  rule: hex("#E3E4E8"),
  panel: hex("#F3F3F5"),
  dotOff: hex("#D5D6DB"),
  white: hex("#FFFFFF"),
  inkMuted: hex("#B4B5BC"),
  inkRule: hex("#3B3C43"),
} as const;

// Тон фона под колонкой: на графите текст светлый.
export enum Tone {
  Light = "light",
  Dark = "dark",
}

export const toneColors: Record<Tone, { text: RGB; muted: RGB; rule: RGB }> = {
  [Tone.Light]: { text: palette.ink, muted: palette.muted, rule: palette.rule },
  [Tone.Dark]: {
    text: palette.white,
    muted: palette.inkMuted,
    rule: palette.inkRule,
  },
};

// A4 в пунктах.
export const page = {
  width: 595.28,
  height: 841.89,
  margin: 32,
  // Ниже этой линии колонки не пишут: там колонтитул.
  bottom: 46,
  footer: 22,
} as const;

export const size = {
  name: 24,
  headline: 10.5,
  section: 8.5,
  body: 9.5,
  small: 8,
  tiny: 7,
  grade: 20,
} as const;

export const specializationRole: Record<Specialization, string> = {
  [Specialization.Backend]: "Бэкенд-разработчик",
  [Specialization.Frontend]: "Фронтенд-разработчик",
  [Specialization.Data]: "Специалист по данным",
  [Specialization.Security]: "Специалист по информационной безопасности",
};

export const gradeLabel: Record<Grade, string> = {
  [Grade.Junior]: "Junior",
  [Grade.Middle]: "Middle",
  [Grade.Senior]: "Senior",
};

export const levelLabel: Record<SkillLevel, string> = {
  [SkillLevel.Basic]: "Базовый",
  [SkillLevel.Confident]: "Уверенный",
  [SkillLevel.Strong]: "Сильный",
};

// Сколько точек из трёх закрашено у уровня навыка.
export const levelRank: Record<SkillLevel, number> = {
  [SkillLevel.Basic]: 1,
  [SkillLevel.Confident]: 2,
  [SkillLevel.Strong]: 3,
};

export const workFormatLabel: Record<WorkFormat, string> = {
  [WorkFormat.Office]: "офис",
  [WorkFormat.Hybrid]: "гибрид",
  [WorkFormat.Remote]: "удалённо",
};

export const searchStatusLabel: Record<SearchStatus, string | null> = {
  [SearchStatus.ActivelyLooking]: "Активно ищет работу",
  [SearchStatus.OpenToOffers]: "Открыт к предложениям",
  [SearchStatus.Hidden]: null,
};

export const sectionTitle = {
  summary: "О кандидате",
  qualification: "Квалификация",
  preferences: "Ожидания",
  contacts: "Контакты",
  skills: "Навыки",
  achievements: "Достижения ФСП",
  experience: "Опыт работы",
  education: "Образование",
} as const;

export const text = {
  noName: "Имя не указано",
  noSkills: "Навыки не указаны",
  verifiedSkills: "Подтверждены",
  claimedSkills: "Заявлены кандидатом",
  skillLegend: "ТЕСТ — тестирование на платформе, ФСП — реестр ФСП",
  gradeVerified: "ПОДТВЕРЖДЁН",
  gradeClaimed: "ЗАЯВЛЕН",
  claimedPrefix: "Заявлен",
  score: "Результат теста",
  testDate: "Тест пройден",
  experience: "Стаж",
  formats: "Формат работы",
  salary: "Зарплата",
  status: "Статус",
  participant: "Участник",
  place: "место",
  footer: "Профиль кандидата · Платформа ФСП · сформирован",
} as const;

// Фразы автосводки «О кандидате». Собирает их buildResume по видимым данным.
export const phrase = {
  role: (role: string, grade: string) => {
    return `${role} уровня ${grade}.`;
  },
  gradeVerified: "Грейд подтверждён тестированием на платформе.",
  gradeScored: (score: number) => {
    return `Грейд подтверждён тестированием на платформе: ${score} из 100.`;
  },
  gradeClaimed: "Грейд заявлен кандидатом, тестирование ещё не пройдено.",
  experience: (years: string) => {
    return `Стаж ${years}.`;
  },
  verifiedSkills: (count: number) => {
    return `Подтверждённых навыков: ${count}.`;
  },
  achievements: (count: number) => {
    return `Достижений в реестре ФСП: ${count}.`;
  },
} as const;
