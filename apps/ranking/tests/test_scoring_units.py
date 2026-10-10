import pytest

from factories import candidate, need
from schemas import RankingContext, ScoreBreakdown
from scoring import (
    _best_skill_score,
    _competency_fit,
    _experience_fit,
    _fsp_fit,
    _grade_fit,
    _salary_fit,
    _semantic_fit,
    _set_overlap_fit,
    _skill_coverage,
    eligibility,
    rank_candidates,
    score_pair,
)


def test_grade_verified_inside_range_scales_with_confidence():
    assert _grade_fit(candidate(), need()) == pytest.approx(0.98)
    assert _grade_fit(candidate(gradeConfidence=1.0), need()) == 1.0
    assert _grade_fit(candidate(gradeConfidence=0.0), need()) == pytest.approx(0.8)


def test_grade_claimed_is_discounted():
    claimed = candidate(verifiedGrade=None, gradeConfidence=0.9)
    assert _grade_fit(claimed, need()) == 0.72


def test_grade_missing_is_neutral():
    assert _grade_fit(candidate(verifiedGrade=None, claimedGrade=None), need()) == 0.35


def test_grade_out_of_range_loses_by_distance():
    strict = need(gradeMin="middle", gradeMax=None)
    far = need(gradeMin="senior", gradeMax=None)
    # на одну ступень ниже минимума: 1 - 0.45, затем шкала доверия 0.98
    assert round(_grade_fit(candidate(), strict), 6) == round(0.55 * 0.98, 6)
    # три ступени: 1 - 0.45 * 3 < 0
    assert _grade_fit(candidate(claimedGrade="intern", verifiedGrade=None), far) == 0.0


def test_salary_without_sides_is_neutral():
    assert _salary_fit(candidate(preferences={"salaryMin": None}), need()) == 0.75
    assert _salary_fit(candidate(), need(salaryMin=None, salaryMax=None)) == 0.75


def test_salary_employer_below_candidate_minimum_scales_down():
    cheaper = need(salaryMin=80000, salaryMax=100000)
    fit = _salary_fit(candidate(preferences={"salaryMin": 200000}), cheaper)
    assert fit == pytest.approx(0.5 * 0.70)


def test_salary_employer_pays_more_is_not_a_mismatch():
    fit = _salary_fit(candidate(preferences={"salaryMax": 100000}), need(salaryMin=150000))
    assert fit == 1.0


def test_salary_overlap_is_full_match():
    assert _salary_fit(candidate(preferences={"salaryMin": 120000}), need()) == 1.0


def test_best_skill_exact_verified_saturates():
    assert _best_skill_score("python", candidate()) == 1.0


def test_best_skill_unverified_is_penalized():
    unverified = candidate(skills=[{"id": "python", "verified": False, "level": 0.9, "confidence": 0.9}])
    expected = (0.60 + 0.20 * 0.9 + 0.20 * 0.9) * 0.78
    assert round(_best_skill_score("python", unverified), 6) == round(expected, 6)


def test_best_skill_related_scores_below_exact():
    related = candidate(skills=[{"id": "python", "verified": True, "level": 0.9, "confidence": 0.9}])
    exact = _best_skill_score("python", related)
    partial = _best_skill_score("fastapi", related)
    assert 0 < partial < exact


def test_best_skill_unknown_returns_zero():
    assert _best_skill_score("cobol", candidate()) == 0.0


def test_skill_coverage_empty_requirement_is_perfect():
    assert _skill_coverage([], candidate()) == 1.0


def test_skill_coverage_averages_requirements():
    only_python = candidate(skills=[{"id": "python", "verified": True, "level": 1.0, "confidence": 1.0}])
    value = _skill_coverage(["python", "cobol"], only_python)
    assert round(value, 6) == 0.5


def test_skill_coverage_verified_only_never_exceeds_full():
    mixed = candidate(
        skills=[
            {"id": "python", "verified": True, "level": 0.9, "confidence": 0.9},
            {"id": "fastapi", "verified": False, "level": 0.9, "confidence": 0.9},
        ],
    )
    assert _skill_coverage(["python", "fastapi"], mixed, verified_only=True) <= _skill_coverage(
        ["python", "fastapi"], mixed
    )


def test_experience_without_bounds_is_neutral():
    assert _experience_fit(candidate(), need(experienceMin=None, experienceMax=None)) == 0.80


def test_experience_gap_shrinks_by_ratio():
    fit = _experience_fit(candidate(experienceYears=1.0), need(experienceMin=5.0, experienceMax=None))
    assert round(fit, 6) == round(1.0 - (4.0 / 5.0) * 0.78, 6)


def test_experience_on_boundary_is_full():
    assert _experience_fit(candidate(experienceYears=5.0), need(experienceMin=5.0, experienceMax=10.0)) == 1.0


def test_experience_overqualification_is_small_risk():
    assert _experience_fit(candidate(experienceYears=50.0), need(experienceMin=1.0, experienceMax=2.0)) == 0.90


def test_semantic_bounds_and_default():
    assert _semantic_fit(candidate(semanticSimilarity=None)) == 0.65
    assert _semantic_fit(candidate(semanticSimilarity=-1.0)) == 0.0
    assert _semantic_fit(candidate(semanticSimilarity=1.0)) == 1.0
    assert _semantic_fit(candidate(semanticSimilarity=0.0)) == 0.5


def test_semantic_falls_back_to_explainable_text_overlap():
    vacancy = need(text="Python FastAPI разработка HTTP API")
    relevant = candidate(
        semanticSimilarity=None,
        profileText="Разрабатывал API на Python и FastAPI",
    )
    irrelevant = candidate(
        semanticSimilarity=None,
        profileText="Дизайн интерфейсов и иллюстрация",
    )
    assert _semantic_fit(relevant, vacancy) > _semantic_fit(irrelevant, vacancy)
    assert _semantic_fit(irrelevant, vacancy) == 0.2


def test_explicit_embedding_overrides_text_fallback():
    item = candidate(
        semanticSimilarity=-1.0,
        profileText="Python FastAPI PostgreSQL",
    )
    assert _semantic_fit(item, need(text="Python FastAPI PostgreSQL")) == 0.0


def test_fsp_strength_rewards_relevant_verified_achievement():
    vacancy = need(text="Python backend разработка API")
    relevant = candidate(
        fspEvidenceScore=0,
        fspEvidence=[
            {
                "title": "ФСП: backend Python API",
                "year": 2025,
                "score": 0.9,
            }
        ],
    )
    unrelated = candidate(
        fspEvidenceScore=0,
        fspEvidence=[
            {
                "title": "ФСП: дизайн интерфейсов",
                "year": 2025,
                "score": 0.9,
            }
        ],
    )
    assert _fsp_fit(relevant, vacancy) > _fsp_fit(unrelated, vacancy) > 0


def test_fsp_absence_is_neutral_zero_and_multiple_results_help():
    vacancy = need(text="Python backend")
    assert _fsp_fit(candidate(fspEvidence=[], fspEvidenceScore=0), vacancy) == 0
    one = candidate(
        fspEvidenceScore=0,
        fspEvidence=[{"title": "Python", "score": 0.7}],
    )
    two = candidate(
        fspEvidenceScore=0,
        fspEvidence=[
            {"title": "Python", "score": 0.7},
            {"title": "Backend", "score": 0.7},
        ],
    )
    assert _fsp_fit(two, vacancy) > _fsp_fit(one, vacancy)


def test_competency_without_weights_falls_back_to_assessment():
    plain = need(competencyWeights={})
    assert _competency_fit(candidate(assessmentScore=0.42), plain, RankingContext()) == 0.42
    assert _competency_fit(candidate(assessmentScore=None), plain, RankingContext()) == 0.68


def test_competency_weighted_average():
    value = _competency_fit(candidate(), need(), RankingContext())
    expected = 0.75 * 0.6 + 0.7 * 0.4
    assert round(value, 6) == round(expected, 6)


def test_competency_all_weights_zero_is_neutral():
    value = _competency_fit(
        candidate(),
        need(competencyWeights={"databases": 0.0, "testing": 0.0}),
        RankingContext(),
    )
    assert value == 0.68


def test_personalization_is_out_of_the_model_until_feedback_exists():
    # Слагаемое персонализации выведено из формулы в rules-v1.2.0: boost'ам
    # неоткуда прийти из контракта. Контекст API остаётся точкой расширения.
    score_pair(candidate(), need(), RankingContext(skillBoosts={"python": 1.0}))
    assert "personalization" not in ScoreBreakdown.model_fields


def test_set_overlap_rules():
    assert _set_overlap_fit(["remote"], ["remote", "office"]) == 1.0
    assert _set_overlap_fit(["remote"], ["office"]) == 0.0
    assert _set_overlap_fit([], ["office"]) == 0.75
    assert _set_overlap_fit([], ["office"], neutral=1.0) == 1.0


def test_eligibility_all_clear():
    assert eligibility(candidate(), need()).eligible is True


def test_eligibility_hidden_candidate():
    result = eligibility(candidate(availability="hidden"), need())
    assert result.eligible is False
    assert result.rejected_by == ["candidate_hidden"]


def test_eligibility_specialization_mismatch():
    result = eligibility(candidate(specialization="frontend"), need())
    assert "specialization_mismatch" in result.rejected_by


def test_eligibility_grade_below_strict_minimum():
    result = eligibility(candidate(), need(strictGrade=True, gradeMin="senior", gradeMax=None))
    assert "grade_below_minimum" in result.rejected_by


def test_eligibility_salary_incompatible():
    result = eligibility(
        candidate(preferences={"salaryMin": 300000}),
        need(salaryMax=200000, strictSalary=True),
    )
    assert "salary_incompatible" in result.rejected_by


def test_eligibility_work_mode_incompatible():
    result = eligibility(candidate(), need(workModes=["office"], strictWorkMode=True))
    assert "work_mode_incompatible" in result.rejected_by


def test_eligibility_location_requires_relocation():
    result = eligibility(
        candidate(preferences={"locations": ["moscow"], "relocation": False}),
        need(locations=["spb"], strictLocation=True),
    )
    assert "location_incompatible" in result.rejected_by
    relaxed = eligibility(
        candidate(preferences={"locations": ["moscow"], "relocation": True}),
        need(locations=["spb"], strictLocation=True),
    )
    assert relaxed.eligible is True


def test_eligibility_must_skill_missing_is_strict():
    result = eligibility(candidate(skills=[]), need(strictMustSkills=True))
    assert "critical_must_skill_missing" in result.rejected_by


def test_eligibility_collects_every_reason():
    broken = candidate(specialization="frontend", availability="hidden", skills=[])
    result = eligibility(
        broken,
        need(strictGrade=True, gradeMin="senior", gradeMax=None, strictMustSkills=True),
    )
    assert set(result.rejected_by) == {
        "candidate_hidden",
        "specialization_mismatch",
        "grade_below_minimum",
        "critical_must_skill_missing",
    }


def test_score_pair_zeroes_ineligible_candidates():
    item = score_pair(candidate(availability="hidden"), need())
    assert item.eligible is False
    assert item.matchScore == 0.0
    assert item.rejectedBy == ["candidate_hidden"]


def test_score_pair_counts_must_skills_reached():
    item = score_pair(candidate(), need(mustSkills=["python", "fastapi"]))
    assert "must_skills_2_of_2" in item.reasons


def test_score_pair_warns_on_unverified_must_skill():
    item = score_pair(
        candidate(skills=[{"id": "python", "verified": False, "level": 0.9, "confidence": 0.9}]),
        need(mustSkills=["python"]),
    )
    assert "skill_not_verified:python" in item.warnings


def test_reason_verified_grade_match():
    item = score_pair(candidate(), need())
    assert "verified_grade_match" in item.reasons


def test_reason_and_warning_grade_not_verified():
    item = score_pair(candidate(verifiedGrade=None), need())
    assert "grade_not_verified" in item.warnings
    assert "verified_grade_match" not in item.reasons


def test_warning_grade_mismatch():
    item = score_pair(candidate(), need(gradeMin="senior", gradeMax=None))
    assert "grade_mismatch" in item.warnings


def test_warning_skill_missing_uses_canonical_name():
    item = score_pair(candidate(skills=[]), need(mustSkills=["Python"]))
    assert "skill_missing:python" in item.warnings


def test_reason_strong_assessment_and_salary_and_work_mode():
    item = score_pair(candidate(assessmentScore=0.95), need())
    assert "strong_assessment" in item.reasons
    assert "salary_full_match" in item.reasons
    assert "work_mode_match" in item.reasons


def test_warning_assessment_missing():
    item = score_pair(candidate(assessmentScore=None), need())
    assert "assessment_missing" in item.warnings
    assert "strong_assessment" not in item.reasons


def test_warning_salary_weak_match():
    item = score_pair(candidate(preferences={"salaryMin": 300000}), need())
    assert "salary_weak_match" in item.warnings
    assert "salary_full_match" not in item.reasons


def test_warning_profile_stale():
    item = score_pair(candidate(profileFreshness=0.30), need())
    assert "profile_stale" in item.warnings


def test_reason_fsp_evidence_present():
    assert "fsp_evidence_present" in score_pair(candidate(fspEvidenceScore=0.02), need()).reasons
    assert "fsp_evidence_present" not in score_pair(candidate(), need()).reasons


def test_warnings_are_truncated_to_eight():
    missing = need(
        mustSkills=[f"skill{i}" for i in range(12)],
        gradeMin="senior",
        gradeMax=None,
    )
    item = score_pair(
        candidate(
            verifiedGrade=None,
            assessmentScore=None,
            profileFreshness=0.1,
            preferences={"salaryMin": 900000},
        ),
        missing,
    )
    assert len(item.warnings) == 8
    assert len(item.reasons) <= 7


def test_higher_assessment_never_lowers_the_score():
    low = score_pair(candidate(assessmentScore=0.30), need())
    high = score_pair(candidate(assessmentScore=0.95), need())
    assert high.matchScore >= low.matchScore
    assert high.qualificationScore >= low.qualificationScore


def test_higher_grade_confidence_never_lowers_the_score():
    low = score_pair(candidate(gradeConfidence=0.0), need())
    high = score_pair(candidate(gradeConfidence=1.0), need())
    assert high.matchScore >= low.matchScore


def test_higher_skill_level_never_lowers_the_score():
    def item(level: float):
        skills = [
            {"id": "python", "verified": True, "level": level, "confidence": 0.9},
            {"id": "fastapi", "verified": True, "level": level, "confidence": 0.9},
            {"id": "postgresql", "verified": True, "level": level, "confidence": 0.9},
        ]
        return score_pair(candidate(skills=skills), need())

    assert item(0.9).matchScore >= item(0.1).matchScore


def test_competency_boost_changes_the_weighting():
    plain = _competency_fit(candidate(), need(), RankingContext())
    up = _competency_fit(candidate(), need(), RankingContext(competencyBoosts={"databases": 1.0}))
    down = _competency_fit(candidate(), need(), RankingContext(competencyBoosts={"databases": -1.0}))
    assert up > plain > down


def test_rank_candidates_puts_eligible_candidates_first():
    items = rank_candidates(
        [candidate(id="hidden", availability="hidden"), candidate(id="visible")],
        need(),
    )
    assert [item.candidateId for item in items] == ["visible", "hidden"]
    assert items[1].matchScore == 0.0


def test_rank_candidates_orders_by_score_desc():
    items = rank_candidates(
        [candidate(id="weak", assessmentScore=0.10), candidate(id="strong", assessmentScore=0.95)],
        need(),
    )
    assert [item.candidateId for item in items] == ["strong", "weak"]


def test_rank_candidates_is_stable_for_equal_scores():
    items = rank_candidates([candidate(id="a"), candidate(id="b"), candidate(id="c")], need())
    assert [item.candidateId for item in items] == ["a", "b", "c"]


def test_rank_candidates_returns_empty_list_for_empty_input():
    assert rank_candidates([], need()) == []


def test_salary_inverted_candidate_range_is_handled_by_min_edge():
    # Схема не валидирует порядок у кандидата: логика опирается на salaryMin,
    # поэтому перевёрнутый диапазон не роняет сервис и не выдаёт NaN.
    inverted_high = candidate(preferences={"salaryMin": 500000, "salaryMax": 100000})
    inverted_low = candidate(preferences={"salaryMin": 100000, "salaryMax": 500000})

    assert round(_salary_fit(inverted_high, need()), 6) == round(180000 / 500000 * 0.70, 6)
    assert _salary_fit(inverted_low, need()) == 1.0
    assert 0.0 <= _salary_fit(inverted_high, need()) <= 1.0


def test_best_skill_reverse_relation_is_discounted():
    # Кандидат знает fastapi, требуется python: обратная связь идёт с коэффициентом 0.8.
    holder = candidate(skills=[{"id": "fastapi", "verified": True, "level": 1.0, "confidence": 1.0}])
    forward = _best_skill_score("fastapi", holder)
    reverse = _best_skill_score("python", holder)
    assert forward == pytest.approx(1.0)
    assert reverse == pytest.approx(0.68 * 0.8)


def test_context_competency_boost_stays_inside_the_scale():
    # Персонализация выведена из формулы; competencyBoosts остаётся живым
    # модификатором внутри слагаемого компетенций (см. _competency_fit).
    plain = _competency_fit(candidate(), need(), RankingContext())
    boosted = _competency_fit(
        candidate(),
        need(),
        RankingContext(skillBoosts={"python": 1.0}, competencyBoosts={"databases": 1.0}),
    )
    assert 0.0 <= plain <= 1.0
    assert 0.0 <= boosted <= 1.0


def test_best_skill_score_grows_with_level_confidence_and_verification():
    def score(**skill):
        base = {"id": "python", "verified": False, "level": 0.1, "confidence": 0.1}
        base.update(skill)
        return _best_skill_score("python", candidate(skills=[base]))

    low = score()
    assert score(level=0.9) > low
    assert score(confidence=0.9) > low
    assert score(verified=True) > low
    assert score(verified=True, level=1.0, confidence=1.0) == pytest.approx(1.0)
