import json
from pathlib import Path

import pytest

from evaluation.gold import generate_gold_set
from evaluation.data_quality import assert_entity_disjoint, assert_no_pii
from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import score_pair

GOLD_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold.jsonl"
TRAIN_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold_train.jsonl"
CALIBRATION_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold_calibration.jsonl"
TEST_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold_test.jsonl"


def load_lines(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def test_gold_dataset_exists():
    assert GOLD_PATH.exists(), f"gold dataset missing at {GOLD_PATH}"


def test_gold_has_required_fields():
    rows = load_lines(GOLD_PATH)
    assert len(rows) > 0
    for row in rows:
        assert "need" in row and "candidate" in row and "label" in row
        need = row["need"]
        candidate = row["candidate"]
        assert isinstance(need.get("id"), str)
        assert isinstance(candidate.get("id"), str)
        label = row["label"]
        assert isinstance(label, int) and 0 <= label <= 3


def test_gold_split_is_deterministic_and_group_disjoint():
    gold = load_lines(GOLD_PATH)
    train = load_lines(TRAIN_PATH)
    calibration = load_lines(CALIBRATION_PATH)
    test = load_lines(TEST_PATH)

    train_ids = {row["need"]["id"] for row in train}
    calibration_ids = {row["need"]["id"] for row in calibration}
    test_ids = {row["need"]["id"] for row in test}

    assert train_ids.isdisjoint(test_ids), "train and test share need groups"
    assert train_ids.isdisjoint(calibration_ids), "train and calibration share groups"
    assert calibration_ids.isdisjoint(test_ids), "calibration and test share groups"
    assert {row["need"]["id"] for row in gold} == train_ids | calibration_ids | test_ids

    generated = generate_gold_set()
    assert [gold, train, calibration, test] == list(generated)


def test_gold_labels_distribution():
    rows = load_lines(GOLD_PATH)
    labels = [row["label"] for row in rows]
    assert set(labels) == {0, 1, 2, 3}
    assert all(row["labelSource"] == "controlled_synthetic_v1" for row in rows)
    assert all(0 < row["labelConfidence"] <= 1 for row in rows)
    assert all(row["qualificationLabel"] in {0, 1, 2, 3} for row in rows)
    assert all(row["intentLabel"] in {0, 1, 2, 3} for row in rows)
    assert all("teacherScore" not in row for row in rows)


def test_bootstrap_relevance_is_only_assigned_to_eligible_candidates():
    for row in load_lines(GOLD_PATH):
        item = score_pair(
            CandidateSnapshot.model_validate(row["candidate"]),
            HiringNeedSnapshot.model_validate(row["need"]),
        )
        assert item.eligible


def test_gold_is_pii_free_and_source_entity_disjoint():
    train = load_lines(TRAIN_PATH)
    calibration = load_lines(CALIBRATION_PATH)
    test = load_lines(TEST_PATH)
    assert_no_pii(train + calibration + test)
    assert_entity_disjoint(train, calibration, test)
    assert all(row["candidate"]["metadata"]["fictional"] for row in train + calibration + test)


def test_gold_labels_are_independent_of_current_rule_order():
    rows = load_lines(GOLD_PATH)
    groups: dict[str, list[dict]] = {}
    for row in rows:
        groups.setdefault(row["need"]["id"], []).append(row)
    # At least one real-vacancy group must contain a scenario whose explicit
    # mutual-fit judgment disagrees with the rules-score ordering.
    disagreement = False
    for group_rows in groups.values():
        need = HiringNeedSnapshot.model_validate(group_rows[0]["need"])
        labeled = sorted(group_rows, key=lambda row: row["label"], reverse=True)
        rules = sorted(
            group_rows,
            key=lambda row: score_pair(CandidateSnapshot.model_validate(row["candidate"]), need).matchScore,
            reverse=True,
        )
        disagreement |= [row["candidate"]["id"] for row in labeled] != [row["candidate"]["id"] for row in rules]
    assert disagreement


@pytest.mark.parametrize(
    "kwargs, message",
    [
        ({"per_group": 3}, "per_group"),
        ({"per_group": 9}, "per_group"),
        ({"groups": 2}, "at least three"),
        ({"train_ratio": 0.0}, "positive"),
        ({"train_ratio": 0.9, "calibration_ratio": 0.2}, "non-empty test"),
    ],
)
def test_gold_generator_rejects_invalid_split_configuration(kwargs, message):
    with pytest.raises(ValueError, match=message):
        generate_gold_set(**kwargs)
