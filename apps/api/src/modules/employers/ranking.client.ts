import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type {
  CandidateSkill,
  CandidateSnapshot,
  HiringNeedInput,
  MatchBreakdown,
  MatchGroup,
} from "@hh/contracts";
import { Grade, SearchStatus, SkillLevel, SkillVerification } from "@hh/types";

// По таймауту отдаём 503, а фронт повторяет загрузку подборки до трёх раз (loadRetry).
// Поэтому ждём недолго: зависший ranking держит оверлей примерно втрое дольше этого числа.
const timeoutMs = 5000;

// Ранжирователь шлёт доли 0..1, контракт подборки — проценты 0..100.
function toHundred(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value * 100)));
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export type RankResult = {
  candidateId: string;
  score: number;
  qualification: number;
  // Дробные значения до округления: подборка сортируется по ним, чтобы
  // ничья по процентам не превращала порядок в лотерею из порядка строк БД.
  rawScore: number;
  rawQualification: number;
  opportunityFit: number;
  reasons: string[];
  risks: string[];
  breakdown: MatchBreakdown[];
};

export type Ranked = {
  modelVersion: string;
  scores: Map<string, RankResult>;
};

type RankResponse = {
  results?: Record<string, unknown>[];
  modelVersion?: unknown;
};

// Уровни каталога навыков кодированные, у ранжирователя шкала 0..1.
const skillLevelScale: Record<SkillLevel, number> = {
  [SkillLevel.Basic]: 0.4,
  [SkillLevel.Confident]: 0.7,
  [SkillLevel.Strong]: 1,
};

// Статусы поиска в контракте с дефисом, в схеме ранжирователя с подчёркиванием.
const availabilityByStatus: Record<SearchStatus, string> = {
  [SearchStatus.ActivelyLooking]: "actively_looking",
  [SearchStatus.OpenToOffers]: "open_to_offers",
  [SearchStatus.Hidden]: "hidden",
};

// Грейд потребности — единственный в контракте носитель требований по стажу.
// Разворачиваем его в experienceMin/Max: без этого слагаемое опыта в формуле
// ранжирователя вырождается в нейтральную константу и кандидат с релевантным
// стажем работодателя не поднимается в списке.
const gradeExperience: Record<Grade, { min: number; max: number }> = {
  [Grade.Junior]: { min: 1, max: 3 },
  [Grade.Middle]: { min: 3, max: 6 },
  [Grade.Senior]: { min: 5, max: 15 },
};

// Разбор по группам контракта. Веса взяты из scoring.py, чтобы UI повторял
// реальный расчёт сервиса, а не оценку, придуманную на стороне Nest.
const breakdownGroups: {
  group: MatchGroup;
  parts: { key: string; label: string; weight: number }[];
}[] = [
  {
    group: "category",
    parts: [
      { key: "specialization", label: "Специализация", weight: 0.09 },
      { key: "grade", label: "Грейд", weight: 0.14 },
      { key: "experience", label: "Опыт", weight: 0.09 },
      { key: "semantic", label: "Смысловое совпадение", weight: 0.04 },
    ],
  },
  {
    group: "skills",
    parts: [
      { key: "mustSkills", label: "Обязательные навыки", weight: 0.26 },
      {
        key: "verifiedMustSkills",
        label: "Подтверждённые обязательные",
        weight: 0.09,
      },
      { key: "niceSkills", label: "Бонусные навыки", weight: 0.04 },
    ],
  },
  {
    group: "assessment",
    parts: [
      { key: "competency", label: "Компетенции", weight: 0.12 },
      { key: "assessment", label: "Тестирование", weight: 0.1 },
    ],
  },
  {
    group: "fsp",
    parts: [{ key: "fspEvidence", label: "Достижения ФСП", weight: 0.03 }],
  },
  {
    group: "preferences",
    parts: [
      { key: "salary", label: "Зарплата", weight: 0.5 },
      { key: "workMode", label: "Формат работы", weight: 0.31 },
      { key: "targetRole", label: "Целевая роль", weight: 0.19 },
    ],
  },
];

const breakdownWeightTotal = breakdownGroups.reduce((total, item) => {
  return total + item.parts.reduce((sum, part) => sum + part.weight, 0);
}, 0);

// Сервис apps/ranking: POST /rank { vacancy, candidates } → { results }.
// Схема сервиса не совпадает с @hh/contracts, поэтому маппим обе стороны здесь,
// а контракт и сгенерированный клиент не трогаем.
@Injectable()
export class RankingClient {
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("RANKING_URL") ?? "http://localhost:8000";
  }

  async rank(
    need: HiringNeedInput,
    candidates: CandidateSnapshot[],
  ): Promise<Ranked> {
    let body: RankResponse;
    try {
      const response = await fetch(`${this.baseUrl}/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toRankRequest(need, candidates)),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      body = (await response.json()) as RankResponse;
    } catch {
      // 503: фронт повторит загрузку, а потом покажет экран ошибки.
      throw new ServiceUnavailableException("Сервис ранжирования недоступен");
    }

    const scores = new Map<string, RankResult>();
    for (const item of body.results ?? []) {
      const candidateId = item.candidateId;
      if (typeof candidateId !== "string") {
        continue;
      }
      const rawScore = clampRatio(
        numberOf(item.matchScore, numberOf(item.score) / 100),
      );
      const rawQualification = clampRatio(
        numberOf(item.qualificationScore, rawScore),
      );
      const score = toHundred(rawScore);
      const scoreRatio = score / 100;
      scores.set(candidateId, {
        candidateId,
        score,
        rawScore,
        rawQualification,
        qualification: toHundred(rawQualification),
        opportunityFit: toHundred(numberOf(item.opportunityFit, scoreRatio)),
        reasons: listOfStrings(item.reasons),
        // Отклонённый кандидат попадает в «риски» причинами eligibility,
        // остальные — предупреждениями сервиса.
        risks: [
          ...listOfStrings(item.rejectedBy),
          ...listOfStrings(item.warnings),
        ],
        breakdown: toBreakdown(item.components),
      });
    }
    return {
      modelVersion:
        typeof body.modelVersion === "string"
          ? body.modelVersion
          : "unknown-ranking",
      scores,
    };
  }
}

export function toRankRequest(
  need: HiringNeedInput,
  candidates: CandidateSnapshot[],
): Record<string, unknown> {
  return {
    vacancy: {
      specialization: need.specialization,
      gradeMin: need.gradeFrom,
      gradeMax: need.gradeTo,
      mustSkills: need.mustSkills,
      niceSkills: need.niceSkills,
      experienceMin: gradeExperience[need.gradeFrom].min,
      experienceMax: gradeExperience[need.gradeTo].max,
      competencyWeights: Object.fromEntries([
        ...need.mustSkills.map((skill) => [skill, 1]),
        ...need.niceSkills.map((skill) => [skill, 0.35]),
      ]),
      salaryMin: need.salaryFrom,
      salaryMax: need.salaryTo,
      workModes: need.workFormats,
      text: need.description,
      // Бюджет и формат работы в потребности жёсткие: без совпадения кандидат
      // остаётся в подборке, но уходит в конец с причиной в «рисках».
      strictSalary: true,
      strictWorkMode: true,
      // Пул кандидатов уже отфильтрован по грейду ±1 ступень (CandidatePoolService),
      // жёсткий грейд ранжирователя отсёк бы согласованную с продуктом выборку.
      strictGrade: false,
      strictMustSkills: false,
      strictLocation: false,
    },
    candidates: candidates.map(toRankCandidate),
  };
}

function toRankCandidate(
  candidate: CandidateSnapshot,
): Record<string, unknown> {
  return {
    id: candidate.id,
    specialization: candidate.specialization,
    claimedGrade: candidate.claimedGrade,
    verifiedGrade: candidate.verifiedGrade,
    gradeConfidence: candidate.gradeConfidence ?? 0.5,
    experienceYears: candidate.experienceYears ?? 0,
    skills: candidate.skills.map(toSkillEvidence),
    assessmentScore:
      candidate.assessmentScore === null
        ? null
        : candidate.assessmentScore / 100,
    competencies: Object.fromEntries(
      candidate.skills
        .filter((skill) => skill.score !== null)
        .map((skill) => [skill.title, (skill.score ?? 0) / 100]),
    ),
    profileText: [
      candidate.specialization,
      ...candidate.skills.map((skill) => skill.title),
    ].join(" "),
    profileFreshness: candidate.profileFreshness,
    // ФСП остаётся supporting evidence: место в соревновании меняет только вес.
    fspEvidence: candidate.fspAchievements.map((achievement) => {
      return {
        title: achievement.title,
        year: achievement.year,
        score: fspScore(achievement.place),
      };
    }),
    preferences: {
      salaryMin: candidate.preferences.desiredSalaryFrom,
      workModes: candidate.preferences.workFormats,
      // Специализация профиля и есть целевая роль кандидата.
      targetSpecializations: [candidate.specialization],
    },
    availability:
      availabilityByStatus[candidate.preferences.searchStatus] ??
      "open_to_offers",
  };
}

function toSkillEvidence(skill: CandidateSkill): Record<string, unknown> {
  const verified =
    skill.verification === SkillVerification.Verified ||
    skill.verification === SkillVerification.VerifiedExternal;
  return {
    id: skill.title,
    // Уровень из каталога может не заполнить — тогда нейтральная середина.
    level: skill.level === null ? 0.5 : skillLevelScale[skill.level],
    // Без балла теста доверие даёт само подтверждение: 0.7 против 0.4.
    confidence:
      skill.score === null ? (verified ? 0.7 : 0.4) : skill.score / 100,
    verified,
  };
}

function fspScore(place: number | null): number {
  if (place === 1) {
    return 0.9;
  }
  if (place === 2) {
    return 0.75;
  }
  if (place === 3) {
    return 0.6;
  }
  return 0.5;
}

export function toBreakdown(components: unknown): MatchBreakdown[] {
  if (typeof components !== "object" || components === null) {
    return [];
  }
  const values = components as Record<string, unknown>;
  const groups: MatchBreakdown[] = [];
  for (const item of breakdownGroups) {
    let weighted = 0;
    let weight = 0;
    const details: string[] = [];
    for (const part of item.parts) {
      const value = values[part.key];
      if (typeof value !== "number") {
        continue;
      }
      weighted += value * part.weight;
      weight += part.weight;
      details.push(`${part.label}: ${toHundred(value)}`);
    }
    if (weight === 0) {
      continue;
    }
    groups.push({
      group: item.group,
      score: toHundred(weighted / weight),
      weight: Number((weight / breakdownWeightTotal).toFixed(4)),
      details,
    });
  }
  return groups;
}

function numberOf(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function listOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => {
    return typeof item === "string";
  });
}
