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

// Брендбук ФСП, как в теме веба (apps/web/src/shared/theme): основной #402FFF и его оттенки,
// акцент #EC1D35, текст #1B1C21. Роли как в Reactive Resume: основной цвет у шапок,
// заголовков, линий, иконок и шкал, подложка — светлый оттенок основного.
export const palette = {
  ink: hex("#1B1C21"),
  primary: hex("#402FFF"),
  // Оттенок 7: квадрат с инициалами на синей шапке Gengar.
  primaryDark: hex("#3424D4"),
  // Оттенок 1: подложка боковой колонки и плитка с инициалами.
  primarySoft: hex("#DEE0FF"),
  accent: hex("#EC1D35"),
  // Заявленный навык: серый рамки поля из темы веба.
  neutral: hex("#848587"),
  white: hex("#FFFFFF"),
  // Разделитель на синей карточке Pikachu: белый на 50% поверх основного.
  onBlockRule: hex("#A097FF"),
} as const;

// Тон фона под колонкой: на графите текст и иконки белые.
export enum Tone {
  Light = "light",
  Dark = "dark",
}

export const toneColors: Record<Tone, { text: RGB; icon: RGB }> = {
  [Tone.Light]: { text: palette.ink, icon: palette.primary },
  [Tone.Dark]: { text: palette.white, icon: palette.white },
};

// A4 в пунктах. Поля, ширина боковой колонки и отступы — как у шаблонов Reactive Resume.
export const page = {
  width: 595.28,
  height: 841.89,
  padding: 14,
  sidebar: 208.5,
} as const;

export const size = {
  body: 10,
  small: 9,
  heading: 10.5,
  name: 17.5,
  nameLarge: 20,
  icon: 10,
  initials: 34,
} as const;

// Межстрочный интервал 1.5, отступы между разделами и записями.
export const rhythm = {
  line: 15,
  smallLine: 13.5,
  headingLine: 16,
  section: 11,
  item: 10,
  iconGap: 5.7,
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

// Сколько делений шкалы из трёх закрашено у уровня навыка.
export const levelRank: Record<SkillLevel, number> = {
  [SkillLevel.Basic]: 1,
  [SkillLevel.Confident]: 2,
  [SkillLevel.Strong]: 3,
};

export const levelSteps = 3;

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
  profiles: "Ссылки",
  skills: "Навыки",
  achievements: "Достижения ФСП",
  experience: "Опыт работы",
  education: "Образование",
} as const;

export const text = {
  noName: "Имя не указано",
  noSkills: "Навыки не указаны",
  gradeVerified: "Подтверждён тестированием",
  gradeClaimed: "Заявлен, тест не пройден",
  claimedPrefix: "Заявлен",
  score: "Результат теста",
  testDate: "Тест пройден",
  experience: "Стаж",
  formats: "Формат работы",
  salary: "Зарплата",
  status: "Статус",
  participant: "Участник",
  place: "место",
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
  score: (score: number) => {
    return `${score} из 100`;
  },
} as const;
