// Ranking V0 из мастер-плана: детерминированная взвешенная сумма. Мок до сервиса apps/ranking.
// Формула прозрачная, чтобы каждая цифра в карточке объяснялась строкой в Why Match.
import { formatSalaryFrom } from "@/shared/lib/format";
import {
  gradeLabel,
  specializationLabel,
  workFormatLabel,
} from "@/shared/lib/labels";

import type {
  CandidateSkill,
  CandidateSnapshot,
  HiringNeedInput,
  Match,
  MatchBreakdown,
} from "@hh/contracts";
import { SearchStatus, SkillVerification, gradeIndex } from "@hh/types";

export const modelVersion = "ranking-v0-mock";

// Qualification — что кандидат доказал, OpportunityFit — сойдутся ли условия.
// Подтверждённые сигналы (тест, ФСП) весят больше, чем слова кандидата о себе.
const weights = {
  category: 0.3,
  skills: 0.3,
  assessment: 0.15,
  fsp: 0.1,
  preferences: 0.15,
} as const;

const verificationCredit: Record<SkillVerification, number> = {
  [SkillVerification.Verified]: 1,
  [SkillVerification.VerifiedExternal]: 1,
  [SkillVerification.Unverified]: 0.5,
};

type Need = Pick<
  HiringNeedInput,
  | "specialization"
  | "gradeFrom"
  | "gradeTo"
  | "mustSkills"
  | "niceSkills"
  | "workFormat"
  | "salaryFrom"
  | "salaryTo"
>;

export function rankCandidates(
  need: Need,
  pool: CandidateSnapshot[],
  dismissed: ReadonlySet<string>,
): Match[] {
  const matches: Match[] = [];
  for (const candidate of pool) {
    const match = scoreCandidate(need, candidate, dismissed.has(candidate.id));
    if (match) {
      matches.push(match);
    }
  }
  return matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (
      (b.candidate.assessmentScore ?? 0) - (a.candidate.assessmentScore ?? 0)
    );
  });
}

function scoreCandidate(
  need: Need,
  candidate: CandidateSnapshot,
  dismissed: boolean,
): Match | null {
  if (candidate.preferences.searchStatus === SearchStatus.Hidden) {
    return null;
  }
  const gradeDistance = distanceToRange(need, candidate);
  // Eligibility: чужая специализация и промах по грейду больше чем на ступень не попадают в подборку.
  if (candidate.specialization !== need.specialization || gradeDistance > 1) {
    return null;
  }

  const category = categoryGroup(need, candidate, gradeDistance);
  const skills = skillsGroup(need, candidate);
  const assessment = assessmentGroup(candidate);
  const fspGroup = fspGroupOf(candidate);
  const preferences = preferencesGroup(need, candidate);

  const qualificationWeight =
    weights.category + weights.skills + weights.assessment + weights.fsp;
  const qualification =
    (category.score * weights.category +
      skills.score * weights.skills +
      assessment.score * weights.assessment +
      fspGroup.score * weights.fsp) /
    qualificationWeight;
  const matchScore =
    qualification * qualificationWeight +
    preferences.score * weights.preferences;

  return {
    candidate,
    matchScore: Math.round(matchScore),
    qualification: Math.round(qualification),
    opportunityFit: Math.round(preferences.score),
    // ФСП стоит раньше навыков, чтобы при обрезке до пяти причин не потерялось.
    reasons: [
      ...category.reasons,
      ...fspGroup.reasons,
      ...skills.reasons,
      ...assessment.reasons,
      ...preferences.reasons,
    ].slice(0, 5),
    // Сначала то, что мешает делать работу (навыки, грейд), потом условия.
    risks: [
      ...skills.risks,
      ...category.risks,
      ...preferences.risks,
      ...assessment.risks,
    ].slice(0, 2),
    breakdown: [
      category.breakdown,
      skills.breakdown,
      assessment.breakdown,
      fspGroup.breakdown,
      preferences.breakdown,
    ],
    dismissed,
  };
}

type Group = {
  score: number;
  reasons: string[];
  risks: string[];
  breakdown: MatchBreakdown;
};

function group(
  key: MatchBreakdown["group"],
  score: number,
  details: string[],
  reasons: string[] = [],
  risks: string[] = [],
): Group {
  const rounded = Math.round(score);
  return {
    score: rounded,
    reasons,
    risks,
    breakdown: { group: key, score: rounded, weight: weights[key], details },
  };
}

function effectiveGrade(candidate: CandidateSnapshot) {
  return candidate.verifiedGrade ?? candidate.claimedGrade;
}

function distanceToRange(need: Need, candidate: CandidateSnapshot): number {
  const grade = gradeIndex(effectiveGrade(candidate));
  const from = gradeIndex(need.gradeFrom);
  const to = gradeIndex(need.gradeTo);
  if (grade < from) {
    return from - grade;
  }
  if (grade > to) {
    return grade - to;
  }
  return 0;
}

function categoryGroup(
  need: Need,
  candidate: CandidateSnapshot,
  gradeDistance: number,
): Group {
  const grade = effectiveGrade(candidate);
  const category = `${specializationLabel[candidate.specialization]} · ${gradeLabel[grade]}`;
  const details: string[] = [];
  const reasons: string[] = [];
  const risks: string[] = [];

  details.push(
    `Специализация совпадает: ${specializationLabel[candidate.specialization]}`,
  );

  if (gradeDistance === 0) {
    details.push(`Грейд ${gradeLabel[grade]} в запрошенном диапазоне`);
  } else {
    const below = gradeIndex(grade) < gradeIndex(need.gradeFrom);
    details.push(
      `Грейд ${gradeLabel[grade]} на ступень ${below ? "ниже" : "выше"} диапазона`,
    );
    risks.push(`Грейд на ступень ${below ? "ниже" : "выше"} запроса`);
  }

  // Неподтверждённый грейд не отсекаем, но доверяем ему меньше.
  let verification = 1;
  if (candidate.verifiedGrade === null) {
    verification = 0.85;
    details.push(
      `Грейд ${gradeLabel[candidate.claimedGrade]} заявлен, тест не пройден`,
    );
    risks.push("Грейд не подтверждён тестом");
  } else if (candidate.verifiedGrade !== candidate.claimedGrade) {
    const raised =
      gradeIndex(candidate.verifiedGrade) > gradeIndex(candidate.claimedGrade);
    details.push(
      `Заявлен ${gradeLabel[candidate.claimedGrade]}, тест показал ${gradeLabel[candidate.verifiedGrade]}`,
    );
    if (raised) {
      reasons.push(
        `Тест показал грейд выше заявленного: ${gradeLabel[candidate.verifiedGrade]}`,
      );
    } else {
      risks.push(
        `Заявлен ${gradeLabel[candidate.claimedGrade]}, подтверждён ${gradeLabel[candidate.verifiedGrade]}`,
      );
    }
  } else {
    details.push(
      `Грейд подтверждён тестом, уверенность ${Math.round((candidate.gradeConfidence ?? 0) * 100)}%`,
    );
  }

  if (gradeDistance === 0) {
    reasons.unshift(
      candidate.verifiedGrade
        ? `Категория подтверждена: ${category}`
        : `Категория в диапазоне запроса: ${category}`,
    );
  }

  const gradeFit = gradeDistance === 0 ? 1 : 0.5;
  return group(
    "category",
    100 * gradeFit * verification,
    details,
    reasons,
    risks,
  );
}

function findSkill(
  candidate: CandidateSnapshot,
  name: string,
): CandidateSkill | undefined {
  const wanted = name.trim().toLowerCase();
  return candidate.skills.find((skill) => {
    return skill.title.toLowerCase() === wanted;
  });
}

function skillCredit(skill: CandidateSkill | undefined): number {
  if (!skill) {
    return 0;
  }
  const base = verificationCredit[skill.verification];
  // У подтверждённого навыка учитываем и сам балл: 60 и 95 баллов теста — разный сигнал.
  if (skill.score === null) {
    return base;
  }
  return base * (0.6 + (0.4 * skill.score) / 100);
}

function isVerified(skill: CandidateSkill | undefined): boolean {
  return (
    skill !== undefined && skill.verification !== SkillVerification.Unverified
  );
}

function skillsGroup(need: Need, candidate: CandidateSnapshot): Group {
  const must = need.mustSkills.map((name) => {
    return { name, skill: findSkill(candidate, name) };
  });
  const nice = need.niceSkills.map((name) => {
    return { name, skill: findSkill(candidate, name) };
  });

  const mustFound = must.filter((item) => {
    return item.skill;
  });
  const mustVerified = must.filter((item) => {
    return isVerified(item.skill);
  });
  const mustMissing = must.filter((item) => {
    return !item.skill;
  });
  const niceFound = nice.filter((item) => {
    return item.skill;
  });

  const mustScore =
    must.reduce((sum, item) => {
      return sum + skillCredit(item.skill);
    }, 0) / Math.max(1, must.length);
  const niceScore = nice.length
    ? nice.reduce((sum, item) => {
        return sum + skillCredit(item.skill);
      }, 0) / nice.length
    : 0;
  const score = nice.length ? 0.8 * mustScore + 0.2 * niceScore : mustScore;

  const details = [
    `Обязательные: ${mustFound.length} из ${must.length}, подтверждены ${mustVerified.length}`,
  ];
  if (nice.length) {
    details.push(`Желательные: ${niceFound.length} из ${nice.length}`);
  }
  const reasons: string[] = [];
  const risks: string[] = [];
  if (mustFound.length > 0 && mustFound.length * 2 >= must.length) {
    reasons.push(`Обязательные навыки: ${mustFound.length} из ${must.length}`);
  }
  if (mustVerified.length > 0) {
    reasons.push(
      `Подтверждены тестом или ФСП: ${mustVerified
        .map((item) => {
          return item.name;
        })
        .join(", ")}`,
    );
  }
  if (mustMissing.length > 0) {
    const names = mustMissing
      .map((item) => {
        return item.name;
      })
      .join(", ");
    details.push(`Нет в профиле: ${names}`);
    risks.push(`Нет навыков: ${names}`);
  }
  return group("skills", 100 * score, details, reasons, risks);
}

function assessmentGroup(candidate: CandidateSnapshot): Group {
  const score = candidate.assessmentScore;
  if (score === null) {
    return group(
      "assessment",
      0,
      ["Тест на грейд не пройден"],
      [],
      ["Нет результатов теста"],
    );
  }
  const reasons = score >= 80 ? [`Тест: ${score}/100 — сильный результат`] : [];
  return group(
    "assessment",
    score,
    [`Итог теста на грейд: ${score}/100`],
    reasons,
  );
}

function fspGroupOf(candidate: CandidateSnapshot): Group {
  const achievements = candidate.fspAchievements;
  if (achievements.length === 0) {
    // Отсутствие истории ФСП — нормальный случай, а не риск: бонуса просто нет.
    return group("fsp", 0, ["Истории ФСП нет — оценка по тесту и навыкам"]);
  }
  const podium = achievements.filter((item) => {
    return item.place !== null && item.place <= 3;
  });
  const score = Math.min(
    100,
    40 + 20 * achievements.length + (podium.length ? 20 : 0),
  );
  const details = achievements.map((item) => {
    return `${item.title}, ${item.year}${item.place ? ` — ${item.place} место` : " — участник"}`;
  });
  const best = podium[0] ?? achievements[0];
  const reason =
    best.place && best.place <= 3
      ? `Призёр ФСП: ${best.place} место, ${best.year}`
      : `Участник соревнований ФСП (${achievements.length})`;
  return group("fsp", score, details, [reason]);
}

function preferencesGroup(need: Need, candidate: CandidateSnapshot): Group {
  const { desiredSalaryFrom, searchStatus, workFormats } =
    candidate.preferences;
  const details: string[] = [];
  const reasons: string[] = [];
  const risks: string[] = [];

  let salary = 1;
  if (desiredSalaryFrom > need.salaryTo) {
    const overshoot = (desiredSalaryFrom - need.salaryTo) / need.salaryTo;
    salary = Math.max(0, 1 - overshoot * 3);
    details.push(
      `Ожидания ${formatSalaryFrom(desiredSalaryFrom)} — выше вилки`,
    );
    risks.push(`Ожидания выше вилки: ${formatSalaryFrom(desiredSalaryFrom)}`);
  } else {
    details.push(`Ожидания ${formatSalaryFrom(desiredSalaryFrom)} — в вилке`);
    reasons.push(`Ожидания в вилке: ${formatSalaryFrom(desiredSalaryFrom)}`);
  }

  const formatFits = workFormats.includes(need.workFormat);
  const format = formatFits ? 1 : 0.3;
  if (formatFits) {
    details.push(`Формат «${workFormatLabel[need.workFormat]}» подходит`);
  } else {
    details.push(
      `Формат «${workFormatLabel[need.workFormat]}» не рассматривает`,
    );
    risks.push(`Не рассматривает формат «${workFormatLabel[need.workFormat]}»`);
  }

  const active = searchStatus === SearchStatus.ActivelyLooking;
  details.push(active ? "Активно ищет работу" : "Открыт к предложениям");
  if (active) {
    reasons.push("Активно ищет работу");
  }

  const score =
    100 * (0.5 * salary + 0.35 * format + 0.15 * (active ? 1 : 0.8));
  return group("preferences", score, details, reasons, risks);
}
