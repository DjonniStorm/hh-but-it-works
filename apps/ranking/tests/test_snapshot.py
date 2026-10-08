import json
import os
from collections import defaultdict
from pathlib import Path

from fastapi.testclient import TestClient

from main import app

SNAPSHOTS = Path(__file__).resolve().parent / "snapshots"
REQUEST = SNAPSHOTS / "rank_request.json"
RESPONSE = SNAPSHOTS / "rank_response.json"
GOLD = Path(__file__).resolve().parents[1] / "evaluation/data/sanity_gold.jsonl"

# Обновить снапшот после намеренного изменения весов:
#   UPDATE_SNAPSHOTS=1 pytest tests/test_snapshot.py
UPDATE = os.environ.get("UPDATE_SNAPSHOTS") == "1"


def test_rank_response_matches_snapshot():
    payload = json.loads(REQUEST.read_text(encoding="utf-8"))
    response = TestClient(app).post("/rank", json=payload)
    assert response.status_code == 200, response.text

    actual = response.json()
    if UPDATE:
        RESPONSE.write_text(
            json.dumps(actual, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    # Сравниваем структуру, а не байты: prettier имеет право переформатировать файл.
    expected = json.loads(RESPONSE.read_text(encoding="utf-8"))
    assert actual == expected, (
        "Ответ /rank разошёлся со снапшотом: либо изменились веса/причины, "
        "и diff нужно вычитать, либо обновите снапшот: UPDATE_SNAPSHOTS=1 pytest tests/test_snapshot.py"
    )


def test_snapshot_covers_both_outcomes():
    body = json.loads(RESPONSE.read_text(encoding="utf-8"))
    results = body["results"]
    assert body["modelVersion"] == "rules-v1.0.0"
    assert any(item["eligible"] for item in results)
    assert any(not item["eligible"] for item in results)
    assert any(item["warnings"] for item in results)
    assert all(item["reasons"] for item in results)
    assert len(results) == len(json.loads(REQUEST.read_text(encoding="utf-8"))["candidates"])


def test_gold_every_group_has_both_a_hit_and_a_miss():
    groups: dict[str, list[int]] = defaultdict(list)
    for line in GOLD.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            groups[str(row["need"]["id"])].append(int(row["label"]))

    assert groups, "gold-набор пуст"
    for group, labels in groups.items():
        assert max(labels) == 3, f"{group}: нет ни одного явного попадания"
        assert min(labels) == 0, f"{group}: нет ни одного явного промаха"
