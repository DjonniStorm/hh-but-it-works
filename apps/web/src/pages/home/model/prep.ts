import { ROUTES } from "@/shared/router/routes";

import type { CandidateProfile } from "@hh/contracts";
import { SkillVerification } from "@hh/types";

// Ссылки карточки подготовки: пока проверяем механику проявления по наведению,
// контент тем прилетит вместе со слайдером подготовки.
export const prepLinks = [
  { to: `${ROUTES.PROFILE}?tab=testing`, label: "Пройти тестирование" },
  { to: ROUTES.PROFILE, label: "Открыть анкету" },
  { to: ROUTES.INVITATIONS, label: "Смотреть приглашения" },
];

// Темы карточки — навыки кандидата, подтверждённые впереди. Пять штук, остальное — «+N».
export function prepTopics(profile: CandidateProfile | null): string[] {
  const skills = profile?.skills ?? [];
  return [...skills]
    .sort((left, right) => {
      return verificationRank(right) - verificationRank(left);
    })
    .slice(0, 5)
    .map((skill) => {
      return skill.title;
    });
}

const verificationRank = (skill: {
  verification: SkillVerification | null;
}) => {
  if (skill.verification === SkillVerification.Unverified) {
    return 0;
  }
  return 1;
};
