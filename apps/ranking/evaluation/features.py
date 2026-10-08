from __future__ import annotations

from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import score_pair

FEATURE_ORDER = [
    "specialization",
    "grade",
    "mustSkills",
    "verifiedMustSkills",
    "niceSkills",
    "competency",
    "assessment",
    "experience",
    "semantic",
    "fspEvidence",
    "salary",
    "workMode",
    "location",
    "employmentType",
    "targetRole",
    "desiredSkills",
    "freshness",
    "personalization",
]


def extract_features(candidate: CandidateSnapshot, need: HiringNeedSnapshot) -> list[float]:
    item = score_pair(candidate, need)
    payload = item.components.model_dump()
    return [float(payload[name]) for name in FEATURE_ORDER]
