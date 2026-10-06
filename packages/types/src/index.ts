export enum Role {
  Candidate = "candidate",
  Employer = "employer",
}

/* подтверждаемые ФСП специализации
  Ну то есть их основные специализации
  Использование их оптимально, но дизайнеров и прочих не указанных
  мы не сможем нанять по таким специализациям :(
*/

export enum Specialization {
  Backend = "backend",
  Frontend = "frontend",
  Data = "data",
  Security = "security",
}

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
}

export enum SearchStatus {
  ActivelyLooking = "actively-looking",
  OpenToOffers = "open-to-offers",
  Hidden = "hidden",
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

// По индексу считается расстояние между грейдами в подборке.
export const gradeOrder: readonly Grade[] = [
  Grade.Junior,
  Grade.Middle,
  Grade.Senior,
];

export function gradeIndex(grade: Grade): number {
  return gradeOrder.indexOf(grade);
}
