from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from benchmark import RankFunction, evaluate
from ltr import LTRRanker
from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import rank_candidates


def dataset_group_hashes(path: Path) -> set[str]:
    rows = [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return {
        hashlib.sha256(str(row["need"]["id"]).encode("utf-8")).hexdigest()
        for row in rows
    }


def calibration_metrics(
    targets: list[float],
    scores: list[float],
    bins: int = 5,
) -> dict[str, float]:
    if not targets or len(targets) != len(scores):
        raise ValueError("targets and scores must be non-empty and equally sized")
    mae = sum(abs(target - score) for target, score in zip(targets, scores)) / len(scores)
    rmse = math.sqrt(
        sum((target - score) ** 2 for target, score in zip(targets, scores))
        / len(scores)
    )
    buckets: list[list[tuple[float, float]]] = [[] for _ in range(bins)]
    for target, score in zip(targets, scores):
        index = min(bins - 1, int(max(0.0, min(1.0, score)) * bins))
        buckets[index].append((target, score))
    ece = 0.0
    for bucket in buckets:
        if not bucket:
            continue
        target_mean = sum(pair[0] for pair in bucket) / len(bucket)
        score_mean = sum(pair[1] for pair in bucket) / len(bucket)
        ece += len(bucket) / len(scores) * abs(target_mean - score_mean)
    return {"mae": mae, "rmse": rmse, "ece": ece}


def evaluate_calibration(path: Path, ranker: RankFunction) -> dict[str, float]:
    rows = [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        groups[str(row["need"]["id"])].append(row)

    targets: list[float] = []
    scores: list[float] = []
    for group_rows in groups.values():
        need = HiringNeedSnapshot.model_validate(group_rows[0]["need"])
        candidates = [
            CandidateSnapshot.model_validate(row["candidate"])
            for row in group_rows
        ]
        by_candidate = {item.candidateId: item.matchScore for item in ranker(candidates, need)}
        for row in group_rows:
            targets.append(int(row["label"]) / 3.0)
            scores.append(by_candidate[row["candidate"]["id"]])
    return calibration_metrics(targets, scores)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, help="independent held-out JSONL")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--calibrator", type=Path)
    parser.add_argument(
        "--min-ndcg-uplift",
        type=float,
        help="diagnostic gate: required pure LTR ndcg@5 delta against rules",
    )
    parser.add_argument(
        "--min-hybrid-ndcg-uplift",
        type=float,
        help="promotion gate: required hybrid ndcg@5 delta against rules",
    )
    parser.add_argument(
        "--hybrid-weight",
        type=float,
        default=0.25,
    )
    parser.add_argument(
        "--max-calibration-rmse-ratio",
        type=float,
        help="require LTR RMSE / rules RMSE to stay at or below this ratio",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    calibrator_path = args.calibrator or args.model.parent / "missing-calibrator.json"
    ltr = LTRRanker(args.model, args.metadata, calibrator_path, mode="ltr")
    if ltr.model is None:
        details = "; ".join(ltr.load_warnings) or "model was not loaded"
        raise SystemExit(f"LTR evaluation unavailable: {details}")

    held_out_groups = dataset_group_hashes(args.dataset)
    trained_groups = set(ltr.metadata.get("groupIdHashes", []))
    calibration_metadata = ltr.metadata.get("calibration") or {}
    calibrated_groups = set(calibration_metadata.get("groupIdHashes", []))
    if not trained_groups or (calibration_metadata and not calibrated_groups):
        raise SystemExit("Artifact metadata does not prove group-disjoint evaluation")
    if held_out_groups & (trained_groups | calibrated_groups):
        raise SystemExit("Held-out dataset overlaps training or calibration groups")

    rules_metrics = evaluate(args.dataset, rank_candidates)
    ltr_metrics = evaluate(args.dataset, ltr.rank)
    hybrid = LTRRanker(
        args.model,
        args.metadata,
        calibrator_path,
        mode="hybrid",
        blend_weight=args.hybrid_weight,
    )
    if hybrid.model is None:
        raise SystemExit("Hybrid evaluation could not load the validated LTR artifact")
    hybrid_metrics = evaluate(args.dataset, hybrid.rank)
    rules_calibration = evaluate_calibration(args.dataset, rank_candidates)
    ltr_calibration = evaluate_calibration(args.dataset, ltr.rank)
    ltr_delta = {
        name: ltr_metrics[name] - rules_metrics[name]
        for name in ("ndcg@5", "ndcg@10", "precision@5", "mrr")
    }
    hybrid_delta = {
        name: hybrid_metrics[name] - rules_metrics[name]
        for name in ("ndcg@5", "ndcg@10", "precision@5", "mrr")
    }
    result = {
        "dataset": str(args.dataset),
        "modelVersion": ltr.model_version,
        "rules": rules_metrics,
        "ltr": ltr_metrics,
        "hybrid": hybrid_metrics,
        "delta": {"ltr": ltr_delta, "hybrid": hybrid_delta},
        # These measure the 0..3 relevance target scaled to 0..1. They are
        # calibration diagnostics, not probabilities of hiring.
        "relevanceCalibration": {
            "rules": rules_calibration,
            "ltr": ltr_calibration,
        },
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

    if (
        args.min_ndcg_uplift is not None
        and ltr_delta["ndcg@5"] < args.min_ndcg_uplift
    ):
        print(
            f"LTR diagnostic gate failed: ndcg@5 uplift={ltr_delta['ndcg@5']:.4f} "
            f"< {args.min_ndcg_uplift}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    if (
        args.min_hybrid_ndcg_uplift is not None
        and hybrid_delta["ndcg@5"] < args.min_hybrid_ndcg_uplift
    ):
        print(
            f"hybrid promotion gate failed: ndcg@5 uplift="
            f"{hybrid_delta['ndcg@5']:.4f} < {args.min_hybrid_ndcg_uplift}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    if args.max_calibration_rmse_ratio is not None:
        rules_rmse = rules_calibration["rmse"]
        ratio = ltr_calibration["rmse"] / rules_rmse if rules_rmse else 0.0
        if ratio > args.max_calibration_rmse_ratio:
            print(
                f"calibration gate failed: rmse ratio={ratio:.4f} > "
                f"{args.max_calibration_rmse_ratio}",
                file=sys.stderr,
            )
            raise SystemExit(1)


if __name__ == "__main__":
    main()
