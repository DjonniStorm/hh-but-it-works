from __future__ import annotations

from collections import Counter
from copy import deepcopy

from schemas import CandidateSnapshot, CareerAction, HiringNeedSnapshot, SkillEvidence, VerificationState
from scoring import rank_candidates
from taxonomy import canonical_skill


def _market_state(
    candidate: CandidateSnapshot,
    opportunities: list[HiringNeedSnapshot],
    threshold: float,
) -> tuple[int, float]:
    if not opportunities:
        return 0, 0.0
    strong = 0
    scores: list[float] = []
    for need in opportunities:
        item = rank_candidates([candidate], need)[0]
        score = item.matchScore if item.eligible else 0.0
        scores.append(score)
        if item.eligible and score >= threshold:
            strong += 1
    return strong, sum(scores) / len(scores)


def _find_skill(candidate: CandidateSnapshot, canonical: str) -> SkillEvidence | None:
    for skill in candidate.skills:
        if canonical_skill(skill.id) == canonical:
            return skill
    return None


def analyze_career(
    candidate: CandidateSnapshot,
    opportunities: list[HiringNeedSnapshot],
    threshold: float,
) -> tuple[int, list[CareerAction], list[str]]:
    relevant = [
        need for need in opportunities
        if need.specialization.strip().lower() == candidate.specialization.strip().lower()
    ]
    current, current_avg = _market_state(candidate, relevant, threshold)
    demand_counter: Counter[str] = Counter()

    for need in relevant:
        for skill in need.mustSkills:
            canonical = canonical_skill(skill)
            existing = _find_skill(candidate, canonical)
            if existing is None or not existing.verified:
                demand_counter[canonical] += 3
        for skill in need.niceSkills:
            canonical = canonical_skill(skill)
            existing = _find_skill(candidate, canonical)
            if existing is None or not existing.verified:
                demand_counter[canonical] += 1

    actions: list[CareerAction] = []
    for skill, frequency in demand_counter.most_common(10):
        simulated = deepcopy(candidate)
        existing = _find_skill(simulated, skill)
        if existing is None:
            kind = "learn_and_verify_skill"
            title = f"Освоить и подтвердить навык {skill}"
            simulated.skills.append(
                SkillEvidence(
                    id=skill,
                    level=0.75,
                    confidence=0.85,
                    verified=True,
                    verificationState=VerificationState.verified,
                )
            )
        else:
            kind = "verify_skill"
            title = f"Подтвердить навык {skill}"
            existing.verified = True
            existing.verificationState = VerificationState.verified
            existing.confidence = max(existing.confidence, 0.85)
            existing.level = max(existing.level, 0.75)

        projected, projected_avg = _market_state(simulated, relevant, threshold)
        uplift = projected - current
        score_uplift = projected_avg - current_avg
        if uplift <= 0 and score_uplift <= 0.002:
            continue
        evidence = [
            f"Навык встречается в требованиях релевантных позиций с весом {frequency}",
        ]
        if uplift > 0:
            evidence.append(f"Симуляция увеличивает число сильных совпадений на {uplift}")
        if score_uplift > 0:
            evidence.append(f"Средний fit по целевому рынку растёт на {score_uplift:.3f}")
        actions.append(
            CareerAction(
                key=f"{kind}:{skill}",
                title=title,
                kind=kind,
                currentStrongMatches=current,
                projectedStrongMatches=projected,
                uplift=uplift,
                currentAverageMatch=round(current_avg, 6),
                projectedAverageMatch=round(projected_avg, 6),
                scoreUplift=round(score_uplift, 6),
                evidence=evidence,
            )
        )

    actions.sort(
        key=lambda item: (item.uplift, item.scoreUplift, item.projectedStrongMatches),
        reverse=True,
    )
    top_gaps = [skill for skill, _ in demand_counter.most_common(5)]
    return current, actions[:5], top_gaps
