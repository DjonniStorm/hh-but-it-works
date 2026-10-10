// Синтетические кандидаты. Живых кандидатов на хакатоне не будет, поэтому сид обязателен.
// Достижения ФСП тех же людей лежат в apps/mock (participants по fspId) — держать одинаковыми.
import {
  Grade,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
  WorkFormat,
} from "@hh/types";

export type SeedSkill = {
  title: string;
  level: SkillLevel;
  verification: SkillVerification;
};

export type SeedAchievement = {
  title: string;
  year: number;
  place: number | null;
};

export type CandidateSeed = {
  id: string;
  specialization: Specialization;
  claimed: Grade;
  verified: Grade | null;
  years: number;
  skills: SeedSkill[];
  assessment: number | null;
  fsp: SeedAchievement[];
  salary: number;
  formats: WorkFormat[];
  status: SearchStatus;
};

const { Hybrid, Office, Remote } = WorkFormat;
const { ActivelyLooking, Hidden, OpenToOffers } = SearchStatus;
const { Junior, Middle, Senior } = Grade;

// Подтверждён тестом платформы. Балл теста нужен только чтобы выбрать уровень.
function tested(title: string, score: number): SeedSkill {
  return {
    title,
    level: levelOf(score),
    verification: SkillVerification.Verified,
  };
}

// Подтверждён снаружи: результатами ФСП.
function fspSkill(title: string, score: number): SeedSkill {
  return {
    title,
    level: levelOf(score),
    verification: SkillVerification.VerifiedExternal,
  };
}

// Со слов кандидата.
function claimed(title: string): SeedSkill {
  return {
    title,
    level: SkillLevel.Confident,
    verification: SkillVerification.Unverified,
  };
}

function levelOf(score: number): SkillLevel {
  if (score >= 85) {
    return SkillLevel.Strong;
  }
  if (score >= 70) {
    return SkillLevel.Confident;
  }
  return SkillLevel.Basic;
}

function fsp(
  title: string,
  year: number,
  place: number | null = null,
): SeedAchievement {
  return { title, year, place };
}

// fspId сид-кандидата: по нему Nest спрашивает историю у мока ФСП.
export function seedFspId(seed: CandidateSeed): string | null {
  return seed.fsp.length > 0 ? `fsp-${seed.id.toLowerCase()}` : null;
}

const championship = "Чемпионат России по спортивному программированию";
const productCup = "Всероссийский чемпионат по продуктовому программированию";
const russiaCup = "Кубок России по спортивному программированию";
const olympiad = "Всероссийская олимпиада ФСП";
const ctf = "Всероссийские соревнования по информационной безопасности (CTF)";

// Под этими кандидатами можно войти, если задан DEMO_PASSWORD (в production тоже).
export const demoCandidateIds = ["B101", "F202"];

export const candidateSeeds: CandidateSeed[] = [
  {
    id: "B101",
    specialization: Specialization.Backend,
    claimed: Middle,
    verified: Middle,
    years: 3.5,
    skills: [
      tested("TypeScript", 88),
      tested("Node.js", 84),
      tested("NestJS", 80),
      tested("PostgreSQL", 76),
      claimed("Redis"),
      claimed("Docker"),
    ],
    assessment: 84,
    fsp: [fsp(productCup, 2025, 2)],
    salary: 220000,
    formats: [Remote, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "B102",
    specialization: Specialization.Backend,
    claimed: Senior,
    verified: Senior,
    years: 6,
    skills: [
      tested("Go", 91),
      tested("PostgreSQL", 88),
      claimed("Kafka"),
      claimed("Kubernetes"),
      tested("Docker", 82),
      tested("System Design", 85),
    ],
    assessment: 90,
    fsp: [],
    salary: 380000,
    formats: [Remote],
    status: OpenToOffers,
  },
  {
    id: "B103",
    specialization: Specialization.Backend,
    claimed: Middle,
    verified: Junior,
    years: 2,
    skills: [
      tested("Python", 70),
      tested("FastAPI", 66),
      claimed("PostgreSQL"),
      claimed("Docker"),
    ],
    assessment: 64,
    fsp: [fsp(russiaCup, 2026)],
    salary: 160000,
    formats: [Office, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "B104",
    specialization: Specialization.Backend,
    claimed: Junior,
    verified: Middle,
    years: 2.5,
    skills: [
      tested("TypeScript", 85),
      tested("Node.js", 82),
      tested("PostgreSQL", 79),
      fspSkill("Алгоритмы", 92),
    ],
    assessment: 81,
    fsp: [fsp(championship, 2025, 1), fsp(olympiad, 2024, 3)],
    salary: 150000,
    formats: [Remote],
    status: ActivelyLooking,
  },
  {
    id: "B105",
    specialization: Specialization.Backend,
    claimed: Middle,
    verified: null,
    years: 4,
    skills: [
      claimed("Java"),
      claimed("Spring"),
      claimed("PostgreSQL"),
      claimed("Kafka"),
    ],
    assessment: null,
    fsp: [],
    salary: 250000,
    formats: [Office],
    status: OpenToOffers,
  },
  {
    id: "B106",
    specialization: Specialization.Backend,
    claimed: Senior,
    verified: Middle,
    years: 7,
    skills: [
      tested("Python", 79),
      tested("Django", 75),
      tested("PostgreSQL", 83),
      tested("Redis", 70),
      claimed("Docker"),
    ],
    assessment: 77,
    fsp: [],
    salary: 300000,
    formats: [Hybrid],
    status: OpenToOffers,
  },
  {
    id: "B107",
    specialization: Specialization.Backend,
    claimed: Middle,
    verified: Middle,
    years: 3,
    skills: [
      tested("Go", 80),
      tested("PostgreSQL", 74),
      tested("Redis", 77),
      tested("Docker", 72),
      fspSkill("Алгоритмы", 88),
    ],
    assessment: 79,
    fsp: [fsp(russiaCup, 2025, 5)],
    salary: 200000,
    formats: [Remote, Hybrid, Office],
    status: ActivelyLooking,
  },
  {
    id: "B108",
    specialization: Specialization.Backend,
    claimed: Junior,
    verified: Junior,
    years: 1,
    skills: [tested("Python", 72), tested("FastAPI", 70), tested("SQL", 68)],
    assessment: 70,
    fsp: [fsp("Региональный этап ФСП", 2026, 2)],
    salary: 90000,
    formats: [Remote, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "B109",
    specialization: Specialization.Backend,
    claimed: Senior,
    verified: null,
    years: 8,
    skills: [claimed("TypeScript"), claimed("NestJS"), claimed("Kubernetes")],
    assessment: null,
    fsp: [],
    salary: 400000,
    formats: [Office],
    status: Hidden,
  },
  {
    id: "F201",
    specialization: Specialization.Frontend,
    claimed: Middle,
    verified: Middle,
    years: 4,
    skills: [
      tested("TypeScript", 86),
      tested("React", 89),
      claimed("Playwright"),
      claimed("Node.js"),
    ],
    assessment: 85,
    fsp: [],
    salary: 230000,
    formats: [Remote],
    status: ActivelyLooking,
  },
  {
    id: "F202",
    specialization: Specialization.Frontend,
    claimed: Senior,
    verified: Senior,
    years: 7,
    skills: [
      tested("TypeScript", 92),
      tested("React", 90),
      tested("System Design", 80),
      claimed("Vue"),
    ],
    assessment: 89,
    fsp: [fsp("Всероссийский хакатон ФСП", 2025, 1)],
    salary: 350000,
    formats: [Hybrid, Remote],
    status: OpenToOffers,
  },
  {
    id: "F203",
    specialization: Specialization.Frontend,
    claimed: Junior,
    verified: null,
    years: 1,
    skills: [claimed("JavaScript"), claimed("React"), claimed("Vue")],
    assessment: null,
    fsp: [],
    salary: 80000,
    formats: [Office, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "F204",
    specialization: Specialization.Frontend,
    claimed: Middle,
    verified: Junior,
    years: 2.5,
    skills: [tested("TypeScript", 68), tested("React", 72), claimed("Vue")],
    assessment: 66,
    fsp: [],
    salary: 180000,
    formats: [Remote],
    status: ActivelyLooking,
  },
  {
    id: "F205",
    specialization: Specialization.Frontend,
    claimed: Junior,
    verified: Junior,
    years: 1.5,
    skills: [
      tested("TypeScript", 74),
      tested("React", 78),
      fspSkill("Алгоритмы", 85),
    ],
    assessment: 76,
    fsp: [fsp(championship, 2026, 4)],
    salary: 110000,
    formats: [Remote, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "F206",
    specialization: Specialization.Frontend,
    claimed: Middle,
    verified: Middle,
    years: 4,
    skills: [
      tested("TypeScript", 83),
      tested("React", 80),
      tested("Node.js", 82),
      claimed("PostgreSQL"),
    ],
    assessment: 81,
    fsp: [fsp(productCup, 2026, 3)],
    salary: 240000,
    formats: [Remote],
    status: ActivelyLooking,
  },
  {
    id: "D301",
    specialization: Specialization.Data,
    claimed: Middle,
    verified: Middle,
    years: 3,
    skills: [
      tested("Python", 87),
      tested("Pandas", 84),
      tested("PyTorch", 78),
      tested("SQL", 80),
    ],
    assessment: 82,
    fsp: [fsp(olympiad, 2025, 2)],
    salary: 230000,
    formats: [Remote, Hybrid],
    status: ActivelyLooking,
  },
  {
    id: "D302",
    specialization: Specialization.Data,
    claimed: Junior,
    verified: Junior,
    years: 1,
    skills: [tested("Python", 74), claimed("Pandas"), tested("SQL", 70)],
    assessment: 71,
    fsp: [],
    salary: 100000,
    formats: [Office],
    status: ActivelyLooking,
  },
  {
    id: "D303",
    specialization: Specialization.Data,
    claimed: Senior,
    verified: null,
    years: 6,
    skills: [claimed("Python"), claimed("Spark"), claimed("SQL")],
    assessment: null,
    fsp: [],
    salary: 320000,
    formats: [Remote],
    status: OpenToOffers,
  },
  {
    id: "S401",
    specialization: Specialization.Security,
    claimed: Middle,
    verified: Middle,
    years: 4,
    skills: [
      tested("Linux", 90),
      tested("Сети", 85),
      fspSkill("Pentest", 88),
      tested("Python", 78),
    ],
    assessment: 85,
    fsp: [fsp(ctf, 2025, 1)],
    salary: 260000,
    formats: [Remote],
    status: OpenToOffers,
  },
  {
    id: "S402",
    specialization: Specialization.Security,
    claimed: Senior,
    verified: Senior,
    years: 8,
    skills: [tested("Linux", 92), tested("OWASP", 90), claimed("Go")],
    assessment: 88,
    fsp: [],
    salary: 380000,
    formats: [Hybrid],
    status: OpenToOffers,
  },
  {
    id: "S403",
    specialization: Specialization.Security,
    claimed: Junior,
    verified: Junior,
    years: 1,
    skills: [tested("Linux", 74), fspSkill("Pentest", 80), claimed("OWASP")],
    assessment: 74,
    fsp: [fsp(ctf, 2026, 3)],
    salary: 110000,
    formats: [Remote, Hybrid],
    status: ActivelyLooking,
  },
];
