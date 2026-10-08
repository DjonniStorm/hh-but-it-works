"""Train and optionally calibrate a LightGBM LambdaRank artifact.

Input JSONL row:
{"need": {...}, "candidate": {...}, "label": 0..3}

The calibration dataset must be group-disjoint from training. The test set is
never accepted here: it remains untouched for ``evaluate_ltr.py``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features import FEATURE_ORDER, extract_features, model_code_sha256
from schemas import CandidateSnapshot, HiringNeedSnapshot


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def group_id_hashes(grouped: dict[str, list[dict]]) -> list[str]:
    return sorted(
        hashlib.sha256(group_id.encode("utf-8")).hexdigest()
        for group_id in grouped
    )


def feature_statistics(x: list[list[float]]) -> dict[str, dict[str, float]]:
    stats: dict[str, dict[str, float]] = {}
    for index, name in enumerate(FEATURE_ORDER):
        values = [row[index] for row in x]
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / len(values)
        stats[name] = {
            "mean": mean,
            "std": math.sqrt(variance),
            "min": min(values),
            "max": max(values),
        }
    return stats


def load_groups(path: Path) -> dict[str, list[dict]]:
    rows = [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[str(row["need"]["id"])].append(row)
    return dict(grouped)


def matrix_from_groups(
    grouped: dict[str, list[dict]],
) -> tuple[list[list[float]], list[int], list[int], list[float]]:
    x: list[list[float]] = []
    y: list[int] = []
    group_sizes: list[int] = []
    sample_weights: list[float] = []

    for group_id in sorted(grouped):
        rows = grouped[group_id]
        if len(rows) < 2:
            raise SystemExit(f"Group {group_id} must contain at least two candidates")
        need = HiringNeedSnapshot.model_validate(rows[0]["need"])
        if need.id is None or str(need.id) != group_id:
            raise SystemExit(f"Group {group_id} has an invalid need.id")
        need_payload = json.dumps(rows[0]["need"], ensure_ascii=False, sort_keys=True)
        candidate_ids: set[str] = set()
        group_sizes.append(len(rows))
        for row in rows:
            if json.dumps(row["need"], ensure_ascii=False, sort_keys=True) != need_payload:
                raise SystemExit(f"Need payload changed inside group {group_id}")
            candidate = CandidateSnapshot.model_validate(row["candidate"])
            if candidate.id in candidate_ids:
                raise SystemExit(f"Duplicate candidate {candidate.id} in group {group_id}")
            candidate_ids.add(candidate.id)
            label = int(row["label"])
            if label not in {0, 1, 2, 3}:
                raise SystemExit(f"Group {group_id} has label outside 0..3")
            confidence = row.get("labelConfidence", 1.0)
            if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
                raise SystemExit(f"Group {group_id} has non-numeric labelConfidence")
            confidence = float(confidence)
            if not math.isfinite(confidence) or not 0 < confidence <= 1:
                raise SystemExit(f"Group {group_id} has labelConfidence outside (0, 1]")
            x.append(extract_features(candidate, need))
            y.append(label)
            sample_weights.append(confidence)

    return x, y, group_sizes, sample_weights


def label_metadata(grouped: dict[str, list[dict]], weights: list[float]) -> dict:
    sources: dict[str, int] = defaultdict(int)
    for rows in grouped.values():
        for row in rows:
            sources[str(row.get("labelSource", "unspecified"))] += 1
    return {
        "sources": dict(sorted(sources.items())),
        "confidence": {
            "min": min(weights),
            "mean": sum(weights) / len(weights),
            "max": max(weights),
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, help="grouped training JSONL")
    parser.add_argument("--output", type=Path, default=Path("model.txt"))
    parser.add_argument("--metadata", type=Path, default=Path("model.meta.json"))
    parser.add_argument(
        "--calibration-dataset",
        type=Path,
        help="group-disjoint JSONL reserved for isotonic calibration",
    )
    parser.add_argument(
        "--calibrator",
        type=Path,
        default=Path("calibrator.json"),
    )
    parser.add_argument("--model-version", default="ltr-v1.1.0")
    parser.add_argument(
        "--production-approved",
        action="store_true",
        help="mark artifact deployable; accepted only for double human annotations",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    try:
        import lightgbm as lgb
    except ImportError as exc:
        raise SystemExit(
            "LightGBM не входит в production dependencies. "
            "Установите requirements-ml.txt для offline training."
        ) from exc

    grouped = load_groups(args.dataset)
    x, y, group_sizes, sample_weights = matrix_from_groups(grouped)
    if not x:
        raise SystemExit("Dataset is empty")
    if len(set(y)) < 2:
        raise SystemExit("Dataset must contain at least two relevance labels")
    training_label_metadata = label_metadata(grouped, sample_weights)
    if args.production_approved and set(training_label_metadata["sources"]) != {
        "human_double_annotation_v1"
    }:
        raise SystemExit(
            "--production-approved requires exclusively "
            "human_double_annotation_v1 labels"
        )
    if args.production_approved and args.calibration_dataset is None:
        raise SystemExit(
            "--production-approved requires an independent human-labeled "
            "calibration dataset"
        )

    training_parameters = {
        "objective": "lambdarank",
        "metric": "ndcg",
        "n_estimators": 180,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "min_child_samples": 5,
        "reg_lambda": 1.0,
        "random_state": 42,
        "deterministic": True,
        "force_col_wise": True,
        "n_jobs": 1,
        "verbosity": -1,
    }
    ranker = lgb.LGBMRanker(
        **training_parameters,
    )
    ranker.fit(x, y, group=group_sizes, sample_weight=sample_weights)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.metadata.parent.mkdir(parents=True, exist_ok=True)
    ranker.booster_.save_model(str(args.output))

    calibration_metadata = None
    if args.calibration_dataset is not None:
        try:
            from sklearn.isotonic import IsotonicRegression
        except ImportError as exc:
            raise SystemExit(
                "Calibration requires scikit-learn from requirements-ml.txt"
            ) from exc

        calibration_groups = load_groups(args.calibration_dataset)
        overlap = set(grouped) & set(calibration_groups)
        if overlap:
            raise SystemExit(
                "Training and calibration groups overlap: " + ", ".join(sorted(overlap))
            )
        calibration_x, calibration_y, _, calibration_weights = matrix_from_groups(calibration_groups)
        if not calibration_x:
            raise SystemExit("Calibration dataset is empty")
        calibration_label_metadata = label_metadata(
            calibration_groups,
            calibration_weights,
        )
        if args.production_approved and set(
            calibration_label_metadata["sources"]
        ) != {"human_double_annotation_v1"}:
            raise SystemExit(
                "--production-approved requires human_double_annotation_v1 "
                "calibration labels"
            )
        raw_scores = [float(value) for value in ranker.predict(calibration_x)]
        if len(set(raw_scores)) < 2:
            raise SystemExit("Model predictions are constant; isotonic calibration is impossible")

        calibrator = IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip")
        calibrator.fit(
            raw_scores,
            [label / 3.0 for label in calibration_y],
            sample_weight=calibration_weights,
        )
        args.calibrator.parent.mkdir(parents=True, exist_ok=True)
        args.calibrator.write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "method": "isotonic",
                    "xThresholds": [float(value) for value in calibrator.X_thresholds_],
                    "yThresholds": [float(value) for value in calibrator.y_thresholds_],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        calibration_metadata = {
            "method": "isotonic",
            "datasetSha256": file_sha256(args.calibration_dataset),
            "groups": len(calibration_groups),
            "rows": len(calibration_x),
            "groupIdHashes": group_id_hashes(calibration_groups),
            "artifact": args.calibrator.name,
            "artifactSha256": file_sha256(args.calibrator),
            "labels": calibration_label_metadata,
        }

    metadata = {
        "artifactSchemaVersion": 1,
        "modelVersion": args.model_version,
        "featureOrder": FEATURE_ORDER,
        "modelCodeSha256": model_code_sha256(),
        "groups": len(group_sizes),
        "rows": len(x),
        "groupIdHashes": group_id_hashes(grouped),
        "labels": sorted(set(y)),
        "labelMetadata": training_label_metadata,
        "trainingParameters": training_parameters,
        "featureStats": feature_statistics(x),
        "lightgbmVersion": lgb.__version__,
        "datasetSha256": file_sha256(args.dataset),
        "modelSha256": file_sha256(args.output),
        "calibration": calibration_metadata,
        "productionApproved": args.production_approved,
        "activationGate": (
            "Approved from double human annotation; independent held-out uplift "
            "must still pass promotion."
            if args.production_approved
            else "Shadow/evaluation only: requires double human annotation and "
            "independent held-out uplift for hybrid/LTR activation."
        ),
    }
    args.metadata.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    outputs = [str(args.output), str(args.metadata)]
    if calibration_metadata is not None:
        outputs.append(str(args.calibrator))
    print("saved " + ", ".join(outputs))


if __name__ == "__main__":
    main()
