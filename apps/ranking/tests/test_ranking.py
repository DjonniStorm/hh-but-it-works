from fastapi.testclient import TestClient

from factories import candidate, need
from main import app
from schemas import RankingContext
from scoring import rank_candidates
from taxonomy import canonical_skill


client = TestClient(app)


def test_aliases_are_canonical_and_java_is_not_javascript():
    assert canonical_skill("Postgres") == "postgresql"
    assert canonical_skill("JS") == "javascript"
    assert canonical_skill("Java") == "java"
    assert canonical_skill("Java") != canonical_skill("JavaScript")


def test_good_candidate_scores_high():
    item = rank_candidates([candidate()], need())[0]
    assert item.eligible
    assert item.matchScore > 0.75
    assert "verified_grade_match" in item.reasons
    assert any(reason.startswith("must_skills_") for reason in item.reasons)


def test_salary_hard_filter_rejects_candidate():
    expensive = candidate(preferences={"salaryMin": 300000, "workModes": ["remote"]})
    item = rank_candidates([expensive], need())[0]
    assert not item.eligible
    assert item.matchScore == 0
    assert "salary_incompatible" in item.rejectedBy


def test_remote_office_hard_conflict():
    remote_only = candidate(preferences={"salaryMin": 120000, "workModes": ["remote"]})
    office_need = need(workModes=["office"], strictWorkMode=True)
    item = rank_candidates([remote_only], office_need)[0]
    assert not item.eligible
    assert "work_mode_incompatible" in item.rejectedBy


def test_verified_grade_is_used_instead_of_claimed_grade():
    overclaimed = candidate(claimedGrade="senior", verifiedGrade="junior")
    senior_need = need(gradeMin="senior", gradeMax="senior", strictGrade=True)
    item = rank_candidates([overclaimed], senior_need)[0]
    assert not item.eligible
    assert "grade_below_minimum" in item.rejectedBy


def test_claimed_grade_without_verification_is_discounted():
    verified = candidate(id="verified")
    claimed = candidate(id="claimed", verifiedGrade=None, claimedGrade="junior")
    results = {item.candidateId: item for item in rank_candidates([verified, claimed], need())}
    assert results["verified"].components.grade > results["claimed"].components.grade
    assert "grade_not_verified" in results["claimed"].warnings


def test_missing_critical_skill_can_be_strictly_rejected():
    no_postgres = candidate(skills=[
        {"id": "python", "verified": True},
        {"id": "fastapi", "verified": True},
    ])
    strict_need = need(strictMustSkills=True)
    item = rank_candidates([no_postgres], strict_need)[0]
    assert not item.eligible
    assert "critical_must_skill_missing" in item.rejectedBy


def test_related_skill_does_not_satisfy_strict_must_have():
    only_sql = candidate(skills=[
        {"id": "python", "verified": True},
        {"id": "fastapi", "verified": True},
        {"id": "sql", "verified": True},
    ])
    strict_need = need(strictMustSkills=True)
    item = rank_candidates([only_sql], strict_need)[0]
    assert not item.eligible


def test_unverified_skill_scores_lower_than_verified_skill():
    verified = candidate(id="verified")
    unverified = candidate(
        id="unverified",
        skills=[
            {"id": "python", "verified": False, "level": 0.9, "confidence": 0.9},
            {"id": "fastapi", "verified": False, "level": 0.9, "confidence": 0.9},
            {"id": "postgresql", "verified": False, "level": 0.9, "confidence": 0.9},
        ],
    )
    results = {item.candidateId: item for item in rank_candidates([verified, unverified], need())}
    assert results["verified"].qualificationScore > results["unverified"].qualificationScore


def test_fsp_absence_is_neutral_not_gate():
    without = candidate(id="without", fspEvidenceScore=0)
    with_fsp = candidate(id="with", fspEvidenceScore=0.05)
    results = rank_candidates([without, with_fsp], need())
    by_id = {item.candidateId: item for item in results}
    assert by_id["without"].eligible
    assert by_id["without"].matchScore > 0
    assert by_id["with"].qualificationScore > by_id["without"].qualificationScore


def test_fsp_structured_evidence_derives_small_bonus():
    with_mock = candidate(
        id="fsp",
        fspEvidence=[{"language": "python", "title": "Олимпиада", "year": 2026, "score": 0.9}],
    )
    assert 0 < with_mock.fspEvidenceScore <= 0.05


def test_ranking_orders_better_candidate_first():
    good = candidate(id="good")
    weak = candidate(
        id="weak",
        verifiedGrade="intern",
        experienceYears=0,
        skills=[{"id": "python", "verified": False}],
        assessmentScore=0.3,
        competencies={"databases": 0.2, "testing": 0.2},
    )
    results = rank_candidates([weak, good], need(strictGrade=False))
    assert results[0].candidateId == "good"


def test_session_feedback_can_reorder_equally_qualified_candidates():
    docker = candidate(id="docker", skills=candidate().skills + [{"id": "docker", "verified": True}])
    redis = candidate(id="redis", skills=candidate().skills + [{"id": "redis", "verified": True}])
    context = RankingContext(skillBoosts={"docker": 1.0, "redis": -1.0})
    results = rank_candidates([redis, docker], need(niceSkills=[]), context)
    assert results[0].candidateId == "docker"


def test_backward_compatible_vacancy_request():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [candidate().model_dump(mode="json")],
    }
    response = client.post("/rank", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["modelVersion"].startswith("rules-v1")
    assert data["results"][0]["matchScore"] > 0


def test_invalid_range_returns_validation_error():
    payload = {
        "hiringNeed": {"specialization": "backend", "salaryMin": 200000, "salaryMax": 100000},
        "candidates": [],
    }
    response = client.post("/rank", json=payload)
    assert response.status_code == 422


def test_health_reports_model_version():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["modelVersion"].startswith("rules-v1")


def test_legacy_score_field_is_serialized():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [candidate().model_dump(mode="json")],
    }
    response = client.post("/rank", json=payload)
    assert response.status_code == 200
    item = response.json()["results"][0]
    assert item["score"] == item["matchScore"]


def test_request_rejects_both_hiring_need_and_vacancy():
    payload = {
        "hiringNeed": need().model_dump(mode="json"),
        "vacancy": need().model_dump(mode="json"),
        "candidates": [],
    }
    response = client.post("/rank", json=payload)
    assert response.status_code == 422


def test_hidden_candidate_is_never_ranked_as_eligible():
    hidden = candidate(availability="hidden")
    item = rank_candidates([hidden], need())[0]
    assert item.eligible is False
    assert item.matchScore == 0
    assert "candidate_hidden" in item.rejectedBy


def test_relocation_allows_location_mismatch_when_location_is_strict():
    moving = candidate(
        preferences={
            "salaryMin": 120000,
            "workModes": ["office"],
            "locations": ["Ульяновск"],
            "relocation": True,
            "targetSpecializations": ["backend"],
        }
    )
    target = need(
        workModes=["office"],
        locations=["Москва"],
        strictLocation=True,
    )
    item = rank_candidates([moving], target)[0]
    assert item.eligible


def test_passive_candidate_gets_lower_intent_than_active():
    active = candidate(id="active", availability="actively_looking")
    passive = candidate(id="passive", availability="passive")
    by_id = {item.candidateId: item for item in rank_candidates([passive, active], need())}
    assert by_id["active"].intentScore > by_id["passive"].intentScore


def test_stale_profile_gets_lower_intent():
    fresh = candidate(id="fresh", profileFreshness=1.0)
    stale = candidate(id="stale", profileFreshness=0.2)
    by_id = {item.candidateId: item for item in rank_candidates([fresh, stale], need())}
    assert by_id["fresh"].intentScore > by_id["stale"].intentScore
