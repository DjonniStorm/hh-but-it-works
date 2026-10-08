import json
import sys
from pathlib import Path

import pytest

GOLD_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold.jsonl"
TRAIN_PATH = Path(__file__).resolve().parents[1] / "evaluation/data/gold_train.jsonl"
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


def test_gold_split_is_deterministic():
    # load gold, train, test, ensure no overlap of need ids across splits
    gold = load_lines(GOLD_PATH)
    train = load_lines(TRAIN_PATH)
    test = load_lines(TEST_PATH)

    train_ids = {row["need"]["id"] for row in train}
    test_ids = {row["need"]["id"] for row in test}

    assert train_ids.isdisjoint(test_ids), "train and test share need groups"
    assert set(row["need"]["id"] for row in gold) == train_ids | test_ids, "some need groups missing"


def test_gold_labels_distribution():
    rows = load_lines(GOLD_PATH)
    labels = [row["label"] for row in rows]
    for l in range(4):
        if labels.count(l) == 0:
            print(f"WARNING: label {l} missing in gold set", file=sys.stderr)
