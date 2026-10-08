import json
from pathlib import Path

from fastapi.testclient import TestClient

from main import app


EXAMPLES = Path(__file__).resolve().parents[1] / "examples"
client = TestClient(app)


def post_example(endpoint: str, name: str) -> dict:
    payload = json.loads((EXAMPLES / name).read_text(encoding="utf-8"))
    response = client.post(endpoint, json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def test_rank_example_from_readme_is_accepted():
    body = post_example("/rank", "rank-request.json")
    assert body["modelVersion"]
    assert body["results"]
    for item in body["results"]:
        assert 0.0 <= item["score"] <= 1.0
        assert item["reasons"]


def test_career_example_from_readme_is_accepted():
    body = post_example("/career/analyze", "career-request.json")
    assert body["modelVersion"]
    assert isinstance(body["actions"], list)
    assert isinstance(body["topGaps"], list)
