from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from pathlib import Path
import sys
from typing import Callable

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import CandidateSnapshot, HiringNeedSnapshot, RankItem
from scoring import rank_candidates, score_pair


def dcg(labels: list[int], k: int) -> float:
    total = 0.0
    for index, label in enumerate(labels[:k], start=1):
        total += (2**label - 1) / math.log2(index + 1)
    return total


def ndcg(labels: list[int], k: int) -> float:
    actual = dcg(labels, k)
    ideal = dcg(sorted(labels, reverse=True), k)
    return actual / ideal if ideal else 0.0


def precision_at_k(labels: list[int], k: int, positive_at: int = 2) -> float:
    if not labels:
        return 0.0
    selected = labels[:k]
    return sum(1 for label in selected if label >= positive_at) / min(k, len(selected))


def reciprocal_rank(labels: list[int], positive_at: int = 2) -> float:
    for index, label in enumerate(labels, start=1):
        if label >= positive_at:
            return 1.0 / index
    return 0.0


RankFunction = Callable[
    [list[CandidateSnapshot], HiringNeedSnapshot],
    list[RankItem],
]


def naive_rank_candidates(
    candidates: list[CandidateSnapshot],
    need: HiringNeedSnapshot,
) -> list[RankItem]:
    """Transparent baseline: exact category, assessment, stable candidate id."""
    scored = [score_pair(candidate, need) for candidate in candidates]
    by_id = {candidate.id: candidate for candidate in candidates}
    return sorted(
        scored,
        key=lambda item: (
            -(by_id[item.candidateId].specialization == need.specialization),
            -(by_id[item.candidateId].assessmentScore or -1.0),
            item.candidateId,
        ),
    )


def evaluate(
    path: Path,
    ranker: RankFunction = rank_candidates,
) -> dict[str, float]:
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        groups[row["need"]["id"]].append(row)

    ndcg5: list[float] = []
    ndcg10: list[float] = []
    p5: list[float] = []
    mrr: list[float] = []

    for group_rows in groups.values():
        need = HiringNeedSnapshot.model_validate(group_rows[0]["need"])
        candidates = [CandidateSnapshot.model_validate(row["candidate"]) for row in group_rows]
        labels = {row["candidate"]["id"]: int(row["label"]) for row in group_rows}
        ranked = ranker(candidates, need)
        ranked_labels = [labels[item.candidateId] for item in ranked]
        ndcg5.append(ndcg(ranked_labels, 5))
        ndcg10.append(ndcg(ranked_labels, 10))
        p5.append(precision_at_k(ranked_labels, 5))
        mrr.append(reciprocal_rank(ranked_labels))

    mean = lambda xs: sum(xs) / len(xs) if xs else 0.0
    return {
        "groups": float(len(groups)),
        "ndcg@5": mean(ndcg5),
        "ndcg@10": mean(ndcg10),
        "precision@5": mean(p5),
        "mrr": mean(mrr),
    }


def compare_with_naive(
    path: Path,
    ranker: RankFunction = rank_candidates,
) -> dict[str, dict[str, float]]:
    model = evaluate(path, ranker)
    baseline = evaluate(path, naive_rank_candidates)
    return {
        "model": model,
        "naive": baseline,
        "delta": {
            name: model[name] - baseline[name]
            for name in ("ndcg@5", "ndcg@10", "precision@5", "mrr")
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, help="JSONL with need, candidate, label(0..3)")
    parser.add_argument("--min-ndcg", type=float, help="минимальный допустимый ndcg@5")
    parser.add_argument("--min-mrr", type=float, help="минимальный допустимый mrr")
    parser.add_argument("--min-precision", type=float, help="минимальный допустимый precision@5")
    parser.add_argument(
        "--compare-naive",
        action="store_true",
        help="also report category + assessment + id baseline",
    )
    args = parser.parse_args()

    result = evaluate(args.dataset)
    output = compare_with_naive(args.dataset) if args.compare_naive else result
    print(json.dumps(output, ensure_ascii=False, indent=2))

    failures = [
        f"{name}={result[name]:.4f} < {limit}"
        for name, limit in (
            ("ndcg@5", args.min_ndcg),
            ("mrr", args.min_mrr),
            ("precision@5", args.min_precision),
        )
        if limit is not None and result[name] < limit
    ]
    if failures:
        print("benchmark thresholds failed: " + ", ".join(failures), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
