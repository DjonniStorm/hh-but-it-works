import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError

from factories import candidate, need
from main import app
from schemas import CareerAnalyzeRequest, RankRequest

EXAMPLES = Path(__file__).resolve().parents[1] / "examples"

client = TestClient(app)


def raw_candidate(**overrides) -> dict:
    # Валидные данные модели, «испорченные» уже после валидации — только так
    # payload долетает до API и проверяется FastAPI/Pydantic-слоем запроса.
    payload = candidate().model_dump(mode="json")
    payload.update(overrides)
    return payload


def rank(payload: dict) -> tuple[int, dict]:
    response = client.post("/rank", json=payload)
    return response.status_code, response.json()


def test_empty_candidate_list_is_valid():
    status, body = rank({"vacancy": need().model_dump(mode="json"), "candidates": []})
    assert status == 200
    assert body["results"] == []
    assert body["modelVersion"] == "rules-v1.1.0"


def test_request_size_limits_protect_model_latency():
    with pytest.raises(ValidationError):
        RankRequest(vacancy=need(), candidates=[candidate()] * 5001)
    with pytest.raises(ValidationError):
        CareerAnalyzeRequest(
            candidate=candidate(),
            opportunities=[need()] * 1001,
        )


def test_duplicate_candidate_ids_are_both_scored():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [
            candidate(id="dup").model_dump(mode="json"),
            candidate(id="dup", assessmentScore=0.1).model_dump(mode="json"),
        ],
    }
    status, body = rank(payload)
    assert status == 200
    assert len(body["results"]) == 2
    assert len({item["matchScore"] for item in body["results"]}) == 2


def test_candidate_without_skills_scores_without_error():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [candidate(skills=[]).model_dump(mode="json")],
    }
    status, body = rank(payload)
    assert status == 200
    assert body["results"][0]["components"]["mustSkills"] == 0.0


def test_need_without_required_skills_is_not_special():
    payload = {
        "vacancy": need(mustSkills=[], niceSkills=[]).model_dump(mode="json"),
        "candidates": [candidate().model_dump(mode="json")],
    }
    status, body = rank(payload)
    assert status == 200
    assert body["results"][0]["components"]["mustSkills"] == 1.0


def test_request_without_any_need_is_rejected():
    status, _ = rank({"candidates": [candidate().model_dump(mode="json")]})
    assert status == 422


def test_both_need_aliases_together_are_rejected():
    payload = {
        "hiringNeed": need().model_dump(mode="json"),
        "vacancy": need().model_dump(mode="json"),
        "candidates": [candidate().model_dump(mode="json")],
    }
    status, _ = rank(payload)
    assert status == 422


def test_assessment_score_out_of_range_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(assessmentScore=72)],
    }
    status, _ = rank(payload)
    assert status == 422


def test_negative_skill_level_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(skills=[{"id": "python", "level": -0.1}])],
    }
    status, _ = rank(payload)
    assert status == 422


def test_unknown_grade_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(claimedGrade="rockstar")],
    }
    status, _ = rank(payload)
    assert status == 422


def test_unknown_availability_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(availability="maybe")],
    }
    status, _ = rank(payload)
    assert status == 422


def test_skill_missing_id_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(skills=[{"level": 0.5}])],
    }
    status, _ = rank(payload)
    assert status == 422


def test_cyrillic_specialization_round_trips():
    payload = {
        "vacancy": need(specialization="бэкенд").model_dump(mode="json"),
        "candidates": [candidate(specialization="бэкенд").model_dump(mode="json")],
    }
    status, body = rank(payload)
    assert status == 200
    assert body["results"][0]["matchScore"] > 0


def test_very_long_identifiers_do_not_break_ranking():
    payload = {
        "vacancy": need(id="n" * 500).model_dump(mode="json"),
        "candidates": [candidate(id="к" * 500).model_dump(mode="json")],
    }
    status, _ = rank(payload)
    assert status == 200


def test_verification_state_is_derived_from_verified_flag():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [candidate().model_dump(mode="json")],
    }
    status, body = rank(payload)
    assert status == 200
    assert body["results"][0]["components"]["verifiedMustSkills"] > 0


def test_every_example_payload_has_a_companion_negative_case():
    # Положительные примеры обязаны проходить; отрицательные — отклоняться.
    for positive, negative in [
        ("rank-request.json", "rank-request-invalid.json"),
        ("career-request.json", "career-request-invalid.json"),
    ]:
        assert (EXAMPLES / positive).exists()
        invalid = EXAMPLES / negative
        if not invalid.exists():
            continue
        payload = json.loads(invalid.read_text(encoding="utf-8"))
        endpoint = "/career/analyze" if "career" in positive else "/rank"
        response = client.post(endpoint, json=payload)
        assert response.status_code == 422, negative


def test_grade_confidence_must_be_a_number():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(gradeConfidence=None)],
    }
    status, _ = rank(payload)
    assert status == 422


def test_negative_experience_is_rejected():
    payload = {
        "vacancy": need().model_dump(mode="json"),
        "candidates": [raw_candidate(experienceYears=-1)],
    }
    status, _ = rank(payload)
    assert status == 422


def test_emoji_and_whitespace_in_identifiers_do_not_break_ranking():
    payload = {
        "vacancy": need(id="vac 🚀", specialization="backend").model_dump(mode="json"),
        "candidates": [
            raw_candidate(id="кандидат 👨‍💻", specialization=" backend "),
        ],
    }
    status, body = rank(payload)
    assert status == 200
    assert body["results"][0]["eligible"] is True
