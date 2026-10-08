from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, computed_field, model_validator


class Grade(str, Enum):
    intern = "intern"
    junior = "junior"
    middle = "middle"
    senior = "senior"


class Availability(str, Enum):
    actively_looking = "actively_looking"
    open_to_offers = "open_to_offers"
    passive = "passive"
    hidden = "hidden"


class VerificationState(str, Enum):
    self_declared = "self_declared"
    queued = "queued"
    verified = "verified"
    unsupported = "unsupported"


class EvidenceSource(str, Enum):
    self_declared = "self_declared"
    resume = "resume"
    assessment = "assessment"
    fsp = "fsp"
    project = "project"
    external = "external"


class EvidenceItem(BaseModel):
    source: EvidenceSource
    score: float = Field(default=0.5, ge=0, le=1)
    confidence: float = Field(default=0.5, ge=0, le=1)
    title: str | None = None
    issuedAt: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SkillEvidence(BaseModel):
    id: str
    level: float = Field(default=0.5, ge=0, le=1)
    confidence: float = Field(default=0.5, ge=0, le=1)
    verified: bool = False
    verificationState: VerificationState | None = None
    years: float | None = Field(default=None, ge=0)
    evidence: list[EvidenceItem] = Field(default_factory=list)

    @model_validator(mode="after")
    def normalize_verification(self) -> "SkillEvidence":
        if self.verificationState is None:
            self.verificationState = VerificationState.verified if self.verified else VerificationState.self_declared
        if self.verificationState == VerificationState.verified:
            self.verified = True
        return self


class CandidatePreferences(BaseModel):
    salaryMin: int | None = Field(default=None, ge=0)
    salaryMax: int | None = Field(default=None, ge=0)
    workModes: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    relocation: bool = False
    targetSpecializations: list[str] = Field(default_factory=list)
    desiredSkills: list[str] = Field(default_factory=list)
    employmentTypes: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)


class FspEvidence(BaseModel):
    language: str | None = None
    title: str
    year: int | None = None
    score: float = Field(default=0.5, ge=0, le=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CandidateSnapshot(BaseModel):
    id: str
    specialization: str
    claimedGrade: Grade | None = None
    verifiedGrade: Grade | None = None
    gradeConfidence: float = Field(default=0.5, ge=0, le=1)
    experienceYears: float = Field(default=0, ge=0)
    skills: list[SkillEvidence] = Field(default_factory=list)
    competencies: dict[str, float] = Field(default_factory=dict)
    assessmentScore: float | None = Field(default=None, ge=0, le=1)
    fspEvidenceScore: float = Field(default=0, ge=0, le=1)
    fspEvidence: list[FspEvidence] = Field(default_factory=list)
    preferences: CandidatePreferences = Field(default_factory=CandidatePreferences)
    availability: Availability = Availability.open_to_offers
    profileFreshness: float = Field(default=1, ge=0, le=1)
    semanticSimilarity: float | None = Field(default=None, ge=-1, le=1)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_competencies(self) -> "CandidateSnapshot":
        for key, value in self.competencies.items():
            if not 0 <= value <= 1:
                raise ValueError(f"competency {key} must be in [0, 1]")
        if self.fspEvidence and self.fspEvidenceScore == 0:
            # Mock/real FSP evidence is a small supporting signal, never a gate.
            self.fspEvidenceScore = min(0.05, sum(item.score for item in self.fspEvidence) / max(len(self.fspEvidence), 1) * 0.05)
        return self


class HiringNeedSnapshot(BaseModel):
    id: str | None = None
    specialization: str
    gradeMin: Grade | None = None
    gradeMax: Grade | None = None
    mustSkills: list[str] = Field(default_factory=list)
    niceSkills: list[str] = Field(default_factory=list)
    competencyWeights: dict[str, float] = Field(default_factory=dict)
    experienceMin: float | None = Field(default=None, ge=0)
    experienceMax: float | None = Field(default=None, ge=0)
    salaryMin: int | None = Field(default=None, ge=0)
    salaryMax: int | None = Field(default=None, ge=0)
    workModes: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    employmentTypes: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    strictSpecialization: bool = True
    strictGrade: bool = False
    strictSalary: bool = True
    strictWorkMode: bool = True
    strictLocation: bool = False
    strictMustSkills: bool = False
    text: str | None = None

    @model_validator(mode="after")
    def validate_ranges(self) -> "HiringNeedSnapshot":
        if self.salaryMin is not None and self.salaryMax is not None and self.salaryMin > self.salaryMax:
            raise ValueError("salaryMin must be <= salaryMax")
        if self.experienceMin is not None and self.experienceMax is not None and self.experienceMin > self.experienceMax:
            raise ValueError("experienceMin must be <= experienceMax")
        if self.gradeMin is not None and self.gradeMax is not None:
            order = {Grade.intern: 0, Grade.junior: 1, Grade.middle: 2, Grade.senior: 3}
            if order[self.gradeMin] > order[self.gradeMax]:
                raise ValueError("gradeMin must be <= gradeMax")
        for key, value in self.competencyWeights.items():
            if value < 0:
                raise ValueError(f"competency weight {key} must be >= 0")
        return self


class RankingContext(BaseModel):
    skillBoosts: dict[str, float] = Field(default_factory=dict)
    competencyBoosts: dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_boosts(self) -> "RankingContext":
        for mapping in (self.skillBoosts, self.competencyBoosts):
            for key, value in mapping.items():
                if not -1 <= value <= 1:
                    raise ValueError(f"boost {key} must be in [-1, 1]")
        return self


class RankRequest(BaseModel):
    hiringNeed: HiringNeedSnapshot | None = None
    vacancy: HiringNeedSnapshot | None = None
    candidates: list[CandidateSnapshot]
    context: RankingContext = Field(default_factory=RankingContext)

    @model_validator(mode="after")
    def exactly_one_need(self) -> "RankRequest":
        if (self.hiringNeed is None) == (self.vacancy is None):
            raise ValueError("exactly one of hiringNeed or vacancy is required")
        return self

    def need(self) -> HiringNeedSnapshot:
        return self.hiringNeed or self.vacancy  # type: ignore[return-value]


class ScoreBreakdown(BaseModel):
    specialization: float
    grade: float
    mustSkills: float
    verifiedMustSkills: float
    niceSkills: float
    competency: float
    assessment: float
    experience: float
    semantic: float
    fspEvidence: float
    salary: float
    workMode: float
    location: float
    employmentType: float
    targetRole: float
    desiredSkills: float
    freshness: float
    personalization: float = 0.5


class RankItem(BaseModel):
    candidateId: str
    eligible: bool
    matchScore: float
    qualificationScore: float
    opportunityFit: float
    intentScore: float
    components: ScoreBreakdown
    reasons: list[str]
    warnings: list[str]
    rejectedBy: list[str]
    modelVersion: str

    @computed_field
    @property
    def score(self) -> float:
        """Backward-compatible alias for legacy clients."""
        return self.matchScore


class RankResponse(BaseModel):
    results: list[RankItem]
    modelVersion: str


class CareerAction(BaseModel):
    key: str
    title: str
    kind: str
    currentStrongMatches: int
    projectedStrongMatches: int
    uplift: int
    currentAverageMatch: float = 0.0
    projectedAverageMatch: float = 0.0
    scoreUplift: float = 0.0
    evidence: list[str]


class CareerAnalyzeRequest(BaseModel):
    candidate: CandidateSnapshot
    opportunities: list[HiringNeedSnapshot]
    strongMatchThreshold: float = Field(default=0.75, ge=0, le=1)


class CareerAnalyzeResponse(BaseModel):
    currentStrongMatches: int
    actions: list[CareerAction]
    topGaps: list[str]
    modelVersion: str
