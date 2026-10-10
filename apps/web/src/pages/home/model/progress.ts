import { ROUTES } from "@/shared/router/routes";

import type { CandidateProfile } from "@hh/contracts";

export type ProgressStep = {
  label: string;
  to: string;
  done: boolean;
};

export type ProfileProgress = {
  percent: number;
  // Шаги одни и те же для кольца в hero и для чек-листа: виджет показывает только невыполненные.
  steps: ProgressStep[];
};

const hasContact = (profile: CandidateProfile | null): boolean => {
  if (!profile) {
    return false;
  }
  return Boolean(
    profile.telegram || profile.github || profile.linkedin || profile.website,
  );
};

// Готовность анкеты: девять быстрых пунктов, которые видны и без серверной валидации.
export function profileProgress(
  profile: CandidateProfile | null,
): ProfileProgress {
  const testing = `${ROUTES.PROFILE}?tab=testing`;
  const steps: ProgressStep[] = [
    {
      label: "Имя",
      to: ROUTES.PROFILE,
      done: Boolean(profile?.displayName),
    },
    {
      label: "Специализация и грейд",
      to: ROUTES.PROFILE,
      done: Boolean(profile?.specialization && profile.claimedGrade),
    },
    {
      label: "Вилка и стаж",
      to: ROUTES.PROFILE,
      done:
        profile?.desiredSalaryFrom != null && profile?.experienceYears != null,
    },
    {
      label: "Формат работы",
      to: ROUTES.PROFILE,
      done: (profile?.workFormats.length ?? 0) > 0,
    },
    {
      label: "Образование",
      to: ROUTES.PROFILE,
      done: (profile?.education.length ?? 0) > 0,
    },
    {
      label: "Опыт работы",
      to: ROUTES.PROFILE,
      done: (profile?.experience.length ?? 0) > 0,
    },
    { label: "Контакты", to: ROUTES.PROFILE, done: hasContact(profile) },
    {
      label: "Навыки",
      to: ROUTES.PROFILE,
      done: (profile?.skills.length ?? 0) > 0,
    },
    {
      label: "Тестирование грейда",
      to: testing,
      done: profile?.assessmentScore != null,
    },
  ];
  const done = steps.filter((step) => {
    return step.done;
  }).length;
  return { percent: Math.round((done * 100) / steps.length), steps };
}
