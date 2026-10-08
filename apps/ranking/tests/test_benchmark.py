import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

from evaluation.benchmark import (
    compare_with_naive,
    dcg,
    evaluate,
    naive_rank_candidates,
    ndcg,
    precision_at_k,
    reciprocal_rank,
)
from evaluation.evaluate_ltr import (
    calibration_metrics,
    dataset_group_hashes,
    evaluate_calibration,
)
from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import rank_candidates

ROOT = Path(__file__).resolve().parents[1]
BENCHMARK = ROOT / "evaluation/benchmark.py"
GOLD = ROOT / "evaluation/data/sanity_gold.jsonl"
SNAPSHOT = ROOT / "evaluation/data/sanity_result.json"


def test_dcg_and_ndcg_known_values():
    assert dcg([3, 0, 0], 3) == 7.0
    assert ndcg([3, 0], 2) == 1.0
    assert ndcg([0, 3], 2) == dcg([0, 3], 2) / dcg([3, 0], 2)
    assert ndcg([0, 0], 2) == 0.0


def test_ndcg_penalises_a_misordered_top():
    assert ndcg([0, 3], 2) < ndcg([3, 0], 2)


def test_precision_and_reciprocal_rank_known_values():
    assert precision_at_k([3, 2, 0, 0], 2) == 1.0
    assert precision_at_k([0, 0, 3], 2) == 0.0
    assert precision_at_k([], 5) == 0.0
    assert reciprocal_rank([0, 0, 2]) == 1 / 3
    assert reciprocal_rank([0]) == 0.0


def test_calibration_metrics_are_zero_for_perfect_scores():
    result = calibration_metrics([0.0, 0.5, 1.0], [0.0, 0.5, 1.0])
    assert result == {"mae": 0.0, "rmse": 0.0, "ece": 0.0}


def test_relevance_calibration_evaluates_the_real_sanity_groups():
    result = evaluate_calibration(GOLD, rank_candidates)

    assert set(result) == {"mae", "rmse", "ece"}
    assert all(0.0 <= value <= 1.0 for value in result.values())
    assert len(dataset_group_hashes(GOLD)) == 3


def test_benchmark_matches_committed_snapshot():
    result = evaluate(GOLD)
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    assert sorted(result) == sorted(snapshot)
    for key, expected in snapshot.items():
        assert result[key] == expected, key


def test_benchmark_is_sensitive_to_a_wrong_ordering(tmp_path):
    rows = [json.loads(line) for line in GOLD.read_text(encoding="utf-8").splitlines() if line]
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        groups[str(row["need"]["id"])].append(row)

    perfect, ruined = [], []
    for group_rows in groups.values():
        need = HiringNeedSnapshot.model_validate(group_rows[0]["need"])
        candidates = [CandidateSnapshot.model_validate(row["candidate"]) for row in group_rows]
        ranked = rank_candidates(candidates, need)
        position = {item.candidateId: index for index, item in enumerate(ranked)}
        ordered = sorted(group_rows, key=lambda row: position[row["candidate"]["id"]])
        labels = list(range(len(ordered)))[::-1]
        for label, row in zip(labels, ordered):
            perfect.append((row, label))
            ruined.append((row, len(ordered) - 1 - label))

    def score(pairs) -> float:
        path = Path(tmp_path / "dataset.jsonl")
        path.write_text(
            "\n".join(
                json.dumps({**row, "label": label}, ensure_ascii=False)
                for row, label in pairs
            ),
            encoding="utf-8",
        )
        return evaluate(path)["ndcg@5"]

    assert score(perfect) == 1.0
    assert score(ruined) < 1.0


def test_benchmark_reports_uplift_over_naive_baseline():
    dataset = ROOT / "evaluation/data/gold_test.jsonl"
    report = compare_with_naive(dataset)
    assert set(report) == {"model", "naive", "delta"}
    assert report["model"] == evaluate(dataset)
    assert report["naive"] == evaluate(dataset, naive_rank_candidates)
    assert report["delta"]["ndcg@5"] > 0


def test_benchmark_cli_fails_when_threshold_not_met():
    args = [sys.executable, str(BENCHMARK), str(GOLD)]

    passed = subprocess.run(
        [*args, "--min-ndcg", "0.9", "--min-mrr", "0.9", "--min-precision", "0.4"],
        capture_output=True,
        text=True,
    )
    assert passed.returncode == 0, passed.stderr

    failed = subprocess.run(
        [*args, "--min-ndcg", "1.5"],
        capture_output=True,
        text=True,
    )
    assert failed.returncode == 1
    assert "thresholds failed" in failed.stderr
