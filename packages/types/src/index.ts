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
