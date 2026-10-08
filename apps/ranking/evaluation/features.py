from __future__ import annotations

import hashlib
from pathlib import Path

from schemas import CandidateSnapshot, HiringNeedSnapshot, RankingContext
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
    # Rules aggregates are useful priors. A future human-labeled LTR model can
    # learn corrections instead of rediscovering the whole baseline formula.
    "qualificationScore",
    "opportunityFit",
    "intentScore",
    "rulesMatchScore",
]

ROOT = Path(__file__).resolve().parents[1]
MODEL_CODE_FILES = [
    ROOT / "scoring.py",
    ROOT / "taxonomy.py",
    ROOT / "text_similarity.py",
    ROOT / "schemas.py",
    Path(__file__).resolve(),
]


def model_code_sha256() -> str:
    digest = hashlib.sha256()
    for path in MODEL_CODE_FILES:
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def extract_features(
    candidate: CandidateSnapshot,
    need: HiringNeedSnapshot,
    context: RankingContext | None = None,
) -> list[float]:
    item = score_pair(candidate, need, context)
    payload = {
        **item.components.model_dump(),
        "qualificationScore": item.qualificationScore,
        "opportunityFit": item.opportunityFit,
        "intentScore": item.intentScore,
        "rulesMatchScore": item.matchScore,
    }
    return [float(payload[name]) for name in FEATURE_ORDER]
