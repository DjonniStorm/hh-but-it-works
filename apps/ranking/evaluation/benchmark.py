from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import rank_candidates


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


def evaluate(path: Path) -> dict[str, float]:
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
        ranked = rank_candidates(candidates, need)
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, help="JSONL with need, candidate, label(0..3)")
    args = parser.parse_args()
    print(json.dumps(evaluate(args.dataset), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
