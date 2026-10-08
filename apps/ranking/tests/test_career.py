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
