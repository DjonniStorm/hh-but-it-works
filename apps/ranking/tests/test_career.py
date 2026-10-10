from career import analyze_career
from schemas import CandidateSnapshot, HiringNeedSnapshot


def _opportunities():
    return [
        HiringNeedSnapshot.model_validate({
            "id": f"n{i}",
            "specialization": "backend",
            "gradeMin": "junior",
            "gradeMax": "middle",
            "mustSkills": ["python", "fastapi", "postgresql"],
            "niceSkills": ["docker"],
            "salaryMax": 180000,
            "workModes": ["remote"],
            "strictMustSkills": i < 3,
        }) for i in range(4)
    ]


def test_career_next_best_action_is_counterfactual():
    candidate = CandidateSnapshot.model_validate({
        "id": "c1",
        "specialization": "backend",
        "verifiedGrade": "junior",
        "skills": [
            {"id": "python", "verified": True},
            {"id": "fastapi", "verified": True},
        ],
        "assessmentScore": 0.78,
        "competencies": {"databases": 0.65},
        "preferences": {
            "salaryMin": 100000,
            "workModes": ["remote"],
            "targetSpecializations": ["backend"],
        },
        "availability": "actively_looking",
    })
    current, actions, gaps = analyze_career(candidate, _opportunities(), 0.70)
    assert "postgresql" in gaps
    assert actions
    assert actions[0].uplift > 0
    assert actions[0].projectedStrongMatches > current
    assert actions[0].kind == "learn_and_verify_skill"


def test_career_prefers_verification_when_skill_is_self_declared():
    candidate = CandidateSnapshot.model_validate({
        "id": "c1",
        "specialization": "backend",
        "verifiedGrade": "junior",
        "skills": [
            {"id": "python", "verified": True},
            {"id": "fastapi", "verified": True},
            {"id": "postgresql", "verified": False, "verificationState": "queued"},
        ],
        "assessmentScore": 0.78,
        "preferences": {"salaryMin": 100000, "workModes": ["remote"], "targetSpecializations": ["backend"]},
        "availability": "actively_looking",
    })
    _, actions, _ = analyze_career(candidate, _opportunities(), 0.70)
    postgres = next(action for action in actions if action.key.endswith(":postgresql"))
    assert postgres.kind == "verify_skill"
    assert postgres.title.startswith("Подтвердить")


def test_career_empty_market_returns_empty_actions():
    candidate = CandidateSnapshot.model_validate({
        "id": "empty",
        "specialization": "backend",
        "claimedGrade": "junior",
        "skills": [{"id": "python", "verified": True}],
    })
    current, actions, gaps = analyze_career(candidate, [], 0.7)
    assert current == 0
    assert actions == []
    assert gaps == []


def test_career_ignores_unrelated_specializations():
    candidate = CandidateSnapshot.model_validate({
        "id": "c1",
        "specialization": "backend",
        "verifiedGrade": "junior",
        "skills": [{"id": "python", "verified": True}],
    })
    unrelated = [
        HiringNeedSnapshot.model_validate({
            "id": "front",
            "specialization": "frontend",
            "mustSkills": ["react"],
        })
    ]
    current, actions, gaps = analyze_career(candidate, unrelated, 0.7)
    assert current == 0
    assert actions == []
    assert gaps == []


def _candidate_with_skills(skills):
    return CandidateSnapshot.model_validate({
        "id": "c1",
        "specialization": "backend",
        "verifiedGrade": "junior",
        "skills": skills,
        "assessmentScore": 0.78,
        "preferences": {
            "salaryMin": 100000,
            "workModes": ["remote"],
            "targetSpecializations": ["backend"],
        },
        "availability": "actively_looking",
    })


def test_career_actions_are_sorted_by_uplift():
    candidate = _candidate_with_skills([{"id": "python", "verified": True}])
    _, actions, _ = analyze_career(candidate, _opportunities(), 0.70)
    uplifts = [(action.uplift, action.scoreUplift) for action in actions]
    assert uplifts == sorted(uplifts, reverse=True)


def test_career_returns_at_most_five_actions_and_gaps():
    candidate = _candidate_with_skills([{"id": "python", "verified": True}])
    _, actions, gaps = analyze_career(candidate, _opportunities(), 0.70)
    assert len(actions) <= 5
    assert len(gaps) <= 5


def test_career_does_not_mutate_the_candidate():
    candidate = _candidate_with_skills([
        {"id": "python", "verified": True},
        {"id": "docker", "verified": False},
    ])
    skills_before = [skill.id for skill in candidate.skills]
    analyze_career(candidate, _opportunities(), 0.70)
    assert [skill.id for skill in candidate.skills] == skills_before
    # Симуляция добавляет навыки в копию: оригинал остаётся с прежним статусом.
    assert {skill.id: skill.verified for skill in candidate.skills} == {
        "python": True,
        "docker": False,
    }


def test_career_skips_fully_verified_requirements():
    candidate = _candidate_with_skills([
        {"id": "python", "verified": True},
        {"id": "fastapi", "verified": True},
        {"id": "postgresql", "verified": True},
        {"id": "docker", "verified": True},
    ])
    _, actions, gaps = analyze_career(candidate, _opportunities(), 0.70)
    assert actions == []
    assert gaps == []


def test_career_analysis_is_deterministic():
    candidate = _candidate_with_skills([{"id": "python", "verified": True}])
    first = analyze_career(candidate, _opportunities(), 0.70)
    second = analyze_career(candidate, _opportunities(), 0.70)
    assert first == second


def test_career_endpoint_returns_model_version():
    from fastapi.testclient import TestClient

    from main import app

    response = TestClient(app).post(
        "/career/analyze",
        json={
            "candidate": _candidate_with_skills(
                [{"id": "python", "verified": True}]
            ).model_dump(mode="json"),
            "opportunities": [
                need.model_dump(mode="json") for need in _opportunities()
            ],
            "strongMatchThreshold": 0.7,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["modelVersion"] == "rules-v1.3.0"
    assert isinstance(body["actions"], list)
    assert isinstance(body["topGaps"], list)


def test_strong_match_threshold_is_inclusive():
    from scoring import rank_candidates

    candidate = _candidate_with_skills([
        {"id": "python", "verified": True},
        {"id": "fastapi", "verified": True},
        {"id": "postgresql", "verified": True},
        {"id": "docker", "verified": True},
    ])
    opportunities = _opportunities()
    ranked = [rank_candidates([candidate], item)[0] for item in opportunities]
    eligible_scores = [item.matchScore for item in ranked if item.eligible]
    assert eligible_scores

    lowest = min(eligible_scores)
    at_boundary = analyze_career(candidate, opportunities, lowest)[0]
    above_boundary = analyze_career(candidate, opportunities, lowest + 1e-6)[0]

    assert at_boundary == len(eligible_scores)
    assert above_boundary == at_boundary - eligible_scores.count(lowest)


def test_top_gaps_never_repeats_a_skill():
    candidate = _candidate_with_skills([{"id": "python", "verified": True}])
    _, _, gaps = analyze_career(candidate, _opportunities(), 0.70)
    assert len(gaps) == len(set(gaps))
