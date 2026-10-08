from __future__ import annotations

from dataclasses import dataclass

from schemas import (
    Availability,
    CandidateSnapshot,
    Grade,
    HiringNeedSnapshot,
    RankItem,
    RankingContext,
    ScoreBreakdown,
)
from taxonomy import canonical_skill, skill_match


MODEL_VERSION = "rules-v1.0.0"
GRADE_VALUE = {Grade.intern: 0, Grade.junior: 1, Grade.middle: 2, Grade.senior: 3}
AVAILABILITY_SCORE = {
    Availability.actively_looking: 1.0,
    Availability.open_to_offers: 0.90,
    Availability.passive: 0.58,
    Availability.hidden: 0.0,
}


@dataclass(frozen=True)
class EligibilityResult:
    eligible: bool
    rejected_by: list[str]


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _grade_fit(candidate: CandidateSnapshot, need: HiringNeedSnapshot) -> float:
    grade = candidate.verifiedGrade or candidate.claimedGrade
    if grade is None:
        return 0.35
    value = GRADE_VALUE[grade]
    min_value = GRADE_VALUE[need.gradeMin] if need.gradeMin is not None else 0
    max_value = GRADE_VALUE[need.gradeMax] if need.gradeMax is not None else 3
    if min_value <= value <= max_value:
        base = 1.0
    else:
        distance = min(abs(value - min_value), abs(value - max_value))
        base = clamp01(1.0 - 0.45 * distance)

    # Verified grade is trusted; claimed grade remains useful but weaker.
    if candidate.verifiedGrade is not None:
        return clamp01(base * (0.80 + 0.20 * candidate.gradeConfidence))
    return clamp01(base * 0.72)


def _salary_fit(candidate: CandidateSnapshot, need: HiringNeedSnapshot) -> float:
    candidate_min = candidate.preferences.salaryMin
    candidate_max = candidate.preferences.salaryMax
    if candidate_min is None and candidate_max is None:
        return 0.75
    if need.salaryMin is None and need.salaryMax is None:
        return 0.75
    if candidate_min is not None and need.salaryMax is not None and need.salaryMax < candidate_min:
        ratio = need.salaryMax / max(candidate_min, 1)
        return clamp01(ratio * 0.70)
    if candidate_max is not None and need.salaryMin is not None and need.salaryMin > candidate_max:
        # Employer paying more than candidate expected is not a mismatch.
        return 1.0
    return 1.0


def _set_overlap_fit(candidate_values: list[str], need_values: list[str], neutral: float = 0.75) -> float:
    if not need_values or not candidate_values:
        return neutral
    candidate_set = {item.strip().lower() for item in candidate_values}
    need_set = {item.strip().lower() for item in need_values}
    return 1.0 if candidate_set & need_set else 0.0


def _best_skill_score(required: str, candidate: CandidateSnapshot, verified_only: bool = False) -> float:
    best = 0.0
    for skill in candidate.skills:
        if verified_only and not skill.verified:
            continue
        relation = skill_match(required, {skill.id}).score
        if relation <= 0:
            continue
        evidence_factor = 0.60 + 0.20 * skill.level + 0.20 * skill.confidence
        if skill.verified:
            evidence_factor = min(1.0, evidence_factor + 0.08)
        else:
            evidence_factor *= 0.78
        best = max(best, relation * evidence_factor)
    return clamp01(best)


def _skill_coverage(required: list[str], candidate: CandidateSnapshot, verified_only: bool = False) -> float:
    if not required:
        return 1.0
    scores = [_best_skill_score(req, candidate, verified_only) for req in required]
    return sum(scores) / len(scores)


def _competency_fit(candidate: CandidateSnapshot, need: HiringNeedSnapshot, context: RankingContext) -> float:
    if not need.competencyWeights:
        return candidate.assessmentScore if candidate.assessmentScore is not None else 0.68
    weighted = 0.0
    total_weight = 0.0
    for name, weight in need.competencyWeights.items():
        adjusted_weight = max(0.0, weight * (1.0 + 0.35 * context.competencyBoosts.get(name, 0.0)))
        total_weight += adjusted_weight
        weighted += candidate.competencies.get(name, 0.0) * adjusted_weight
    if total_weight <= 0:
        return 0.68
    return clamp01(weighted / total_weight)


def _experience_fit(candidate: CandidateSnapshot, need: HiringNeedSnapshot) -> float:
    years = candidate.experienceYears
    if need.experienceMin is None and need.experienceMax is None:
        return 0.80
    if need.experienceMin is not None and years < need.experienceMin:
        gap = need.experienceMin - years
        return clamp01(1.0 - min(gap / max(need.experienceMin, 1.0), 1.0) * 0.78)
    if need.experienceMax is not None and years > need.experienceMax:
        # Overqualification is a small risk, not an automatic failure.
        return 0.90
    return 1.0


def _semantic_fit(candidate: CandidateSnapshot) -> float:
    if candidate.semanticSimilarity is None:
        return 0.65
    return clamp01((candidate.semanticSimilarity + 1.0) / 2.0)


def _personalization_fit(candidate: CandidateSnapshot, need: HiringNeedSnapshot, context: RankingContext) -> float:
    if not context.skillBoosts and not context.competencyBoosts:
        return 0.5

    skill_total = 0.0
    skill_weight = 0.0
    for raw_skill, boost in context.skillBoosts.items():
        weight = abs(boost)
        if weight == 0:
            continue
        matched = _best_skill_score(raw_skill, candidate)
        desired = matched if boost > 0 else 1.0 - matched
        skill_total += desired * weight
        skill_weight += weight

    competency_total = 0.0
    competency_weight = 0.0
    for name, boost in context.competencyBoosts.items():
        weight = abs(boost)
        if weight == 0:
            continue
        value = candidate.competencies.get(name, 0.0)
        desired = value if boost > 0 else 1.0 - value
        competency_total += desired * weight
        competency_weight += weight

    total_weight = skill_weight + competency_weight
    if total_weight == 0:
        return 0.5
    return clamp01((skill_total + competency_total) / total_weight)


def eligibility(candidate: CandidateSnapshot, need: HiringNeedSnapshot) -> EligibilityResult:
    reasons: list[str] = []

    if candidate.availability == Availability.hidden:
        reasons.append("candidate_hidden")

    if need.strictSpecialization and candidate.specialization.strip().lower() != need.specialization.strip().lower():
        reasons.append("specialization_mismatch")

    grade = candidate.verifiedGrade or candidate.claimedGrade
    if need.strictGrade and need.gradeMin is not None:
        if grade is None or GRADE_VALUE[grade] < GRADE_VALUE[need.gradeMin]:
            reasons.append("grade_below_minimum")

    if need.strictSalary and candidate.preferences.salaryMin is not None and need.salaryMax is not None:
        if candidate.preferences.salaryMin > need.salaryMax:
            reasons.append("salary_incompatible")

    if need.strictWorkMode and need.workModes and candidate.preferences.workModes:
        if _set_overlap_fit(candidate.preferences.workModes, need.workModes, neutral=1.0) == 0:
            reasons.append("work_mode_incompatible")

    if need.strictLocation and need.locations and candidate.preferences.locations and not candidate.preferences.relocation:
        if _set_overlap_fit(candidate.preferences.locations, need.locations, neutral=1.0) == 0:
            reasons.append("location_incompatible")

    if need.strictMustSkills and need.mustSkills:
        exact_candidate = {canonical_skill(skill.id) for skill in candidate.skills}
        missing = [skill for skill in need.mustSkills if canonical_skill(skill) not in exact_candidate]
        if missing:
            reasons.append("critical_must_skill_missing")

    return EligibilityResult(not reasons, reasons)


def _reasons_and_warnings(candidate: CandidateSnapshot, need: HiringNeedSnapshot, components: ScoreBreakdown) -> tuple[list[str], list[str]]:
    reasons: list[str] = []
    warnings: list[str] = []

    if components.grade >= 0.90 and candidate.verifiedGrade is not None:
        reasons.append("verified_grade_match")
    elif candidate.verifiedGrade is None and candidate.claimedGrade is not None:
        warnings.append("grade_not_verified")
    elif components.grade < 0.60:
        warnings.append("grade_mismatch")

    if need.mustSkills:
        exact_candidate = {canonical_skill(skill.id) for skill in candidate.skills}
        exact_count = 0
        for required in need.mustSkills:
            score = _best_skill_score(required, candidate)
            verified_score = _best_skill_score(required, candidate, verified_only=True)
            canonical = canonical_skill(required)
            if canonical in exact_candidate:
                exact_count += 1
            if score < 0.35:
                warnings.append(f"skill_missing:{canonical}")
            elif verified_score < 0.75:
                warnings.append(f"skill_not_verified:{canonical}")
        reasons.append(f"must_skills_{exact_count}_of_{len(need.mustSkills)}")

    if components.assessment >= 0.80:
        reasons.append("strong_assessment")
    elif candidate.assessmentScore is None:
        warnings.append("assessment_missing")

    if components.salary >= 0.95:
        reasons.append("salary_full_match")
    elif components.salary < 0.50:
        warnings.append("salary_weak_match")

    if components.workMode >= 0.95 and need.workModes:
        reasons.append("work_mode_match")

    if candidate.fspEvidenceScore > 0:
        reasons.append("fsp_evidence_present")

    if components.freshness < 0.55:
        warnings.append("profile_stale")

    return reasons[:7], warnings[:8]


def score_pair(candidate: CandidateSnapshot, need: HiringNeedSnapshot, context: RankingContext | None = None) -> RankItem:
    context = context or RankingContext()
    eligible = eligibility(candidate, need)

    specialization = 1.0 if candidate.specialization.strip().lower() == need.specialization.strip().lower() else 0.35
    grade = _grade_fit(candidate, need)
    must = _skill_coverage(need.mustSkills, candidate)
    verified_must = _skill_coverage(need.mustSkills, candidate, verified_only=True)
    nice = _skill_coverage(need.niceSkills, candidate)
    competency = _competency_fit(candidate, need, context)
    assessment = candidate.assessmentScore if candidate.assessmentScore is not None else 0.62
    experience = _experience_fit(candidate, need)
    semantic = _semantic_fit(candidate)
    fsp = clamp01(candidate.fspEvidenceScore / 0.05) if candidate.fspEvidenceScore > 0 else 0.0
    salary = _salary_fit(candidate, need)
    work_mode = _set_overlap_fit(candidate.preferences.workModes, need.workModes)
    location = _set_overlap_fit(candidate.preferences.locations, need.locations)
    employment = _set_overlap_fit(candidate.preferences.employmentTypes, need.employmentTypes)
    target_role = _set_overlap_fit(candidate.preferences.targetSpecializations, [need.specialization])

    if candidate.preferences.desiredSkills:
        need_skill_set = {canonical_skill(skill) for skill in (need.mustSkills + need.niceSkills)}
        desired = [canonical_skill(skill) for skill in candidate.preferences.desiredSkills]
        desired_skills = sum(1 for skill in desired if skill in need_skill_set) / len(desired)
    else:
        desired_skills = 0.75

    freshness = candidate.profileFreshness
    personalization = _personalization_fit(candidate, need, context)

    qualification = (
        0.10 * specialization
        + 0.14 * grade
        + 0.20 * must
        + 0.09 * verified_must
        + 0.04 * nice
        + 0.12 * competency
        + 0.09 * assessment
        + 0.09 * experience
        + 0.08 * semantic
        + 0.03 * fsp
        + 0.02 * personalization
    )
    opportunity = (
        0.35 * salary
        + 0.22 * work_mode
        + 0.12 * location
        + 0.08 * employment
        + 0.13 * target_role
        + 0.10 * desired_skills
    )
    intent = AVAILABILITY_SCORE[candidate.availability] * (0.62 + 0.38 * freshness)

    qualification = clamp01(qualification)
    opportunity = clamp01(opportunity)
    intent = clamp01(intent)

    if eligible.eligible:
        mutual = (max(qualification, 1e-6) ** 0.55) * (max(opportunity, 1e-6) ** 0.30) * (max(intent, 1e-6) ** 0.15)
    else:
        mutual = 0.0

    components = ScoreBreakdown(
        specialization=round(specialization, 4),
        grade=round(grade, 4),
        mustSkills=round(must, 4),
        verifiedMustSkills=round(verified_must, 4),
        niceSkills=round(nice, 4),
        competency=round(competency, 4),
        assessment=round(assessment, 4),
        experience=round(experience, 4),
        semantic=round(semantic, 4),
        fspEvidence=round(fsp, 4),
        salary=round(salary, 4),
        workMode=round(work_mode, 4),
        location=round(location, 4),
        employmentType=round(employment, 4),
        targetRole=round(target_role, 4),
        desiredSkills=round(desired_skills, 4),
        freshness=round(freshness, 4),
        personalization=round(personalization, 4),
    )
    reasons, warnings = _reasons_and_warnings(candidate, need, components)

    return RankItem(
        candidateId=candidate.id,
        eligible=eligible.eligible,
        matchScore=round(clamp01(mutual), 6),
        qualificationScore=round(qualification, 6),
        opportunityFit=round(opportunity, 6),
        intentScore=round(intent, 6),
        components=components,
        reasons=reasons,
        warnings=warnings,
        rejectedBy=eligible.rejected_by,
        modelVersion=MODEL_VERSION,
    )


def rank_candidates(
    candidates: list[CandidateSnapshot],
    need: HiringNeedSnapshot,
    context: RankingContext | None = None,
) -> list[RankItem]:
    scored = [score_pair(candidate, need, context) for candidate in candidates]
    return sorted(scored, key=lambda item: (item.eligible, item.matchScore, item.qualificationScore), reverse=True)
