export enum Role {
  Candidate = "candidate",
  Employer = "employer",
}

export { Specialization } from "./specialization";

export enum Grade {
  Junior = "junior",
  Middle = "middle",
  Senior = "senior",
}

export enum SkillLevel {
  Basic = "basic",
  Confident = "confident",
  Strong = "strong",
}

export enum SkillVerification {
  Unverified = "unverified",
  Verified = "verified",
  VerifiedExternal = "verified_external",
}

export enum WorkFormat {
  Office = "office",
  Hybrid = "hybrid",
  Remote = "remote",
}

export enum InvitationStatus {
  Sent = "sent",
  Viewed = "viewed",
  Accepted = "accepted",
  Declined = "declined",
  Withdrawn = "withdrawn",
}

export enum SearchStatus {
  ActivelyLooking = "actively-looking",
  OpenToOffers = "open-to-offers",
  Hidden = "hidden",
}

// Оформление PDF-профиля. Раскладки взяты из Reactive Resume (MIT), цвета — ФСП.
export enum ResumeTemplate {
  Ditto = "ditto",
  Gengar = "gengar",
  Pikachu = "pikachu",
}

export enum AttemptStatus {
  Passed = "passed",
  Failed = "failed",
  Annulled = "annulled",
}

// Сигналы, что попытку могли пройти не сами. Первые пять шлёт браузер, остальные видит сервер.
export enum IntegrityFlag {
  TabHidden = "tab-hidden",
  WindowBlur = "window-blur",
  FullscreenExit = "fullscreen-exit",
  FullscreenDenied = "fullscreen-denied",
  Copy = "copy",
  IpChange = "ip-change",
  AgentChange = "agent-change",
  FastAnswer = "fast-answer",
}

// Тип достижения в реестре ФСП: соревнование, кубок, олимпиада и документы.
export enum FspAchievementKind {
  Competition = "competition",
  Cup = "cup",
  Olympiad = "olympiad",
  Hackathon = "hackathon",
  Diploma = "diploma",
  Certificate = "certificate",
}

// Уровень соревнования, как его помнит реестр.
export enum FspAchievementLevel {
  Regional = "regional",
  Interregional = "interregional",
  AllRussia = "all_russia",
  Russia = "russia",
  International = "international",
}

// Спортивный разряд программиста из реестра ФСП.
export enum FspSportRank {
  Rank3 = "rank3",
  Rank2 = "rank2",
  Rank1 = "rank1",
  Kms = "kms",
  Ms = "ms",
  Msmk = "msmk",
}

// По индексу считается расстояние между грейдами в подборке.
export const gradeOrder: readonly Grade[] = [
  Grade.Junior,
  Grade.Middle,
  Grade.Senior,
];

export function gradeIndex(grade: Grade): number {
  return gradeOrder.indexOf(grade);
}

export {
  coreSkillSlugs,
  relatedSkillSlug,
  skillCatalog,
} from "./skill-catalog";
export type { SkillCatalogItem } from "./skill-catalog";
