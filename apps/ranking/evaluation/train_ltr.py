"""Train optional V1 LightGBM LambdaRank model from a JSONL gold dataset.

Input row format:
{"need": {...}, "candidate": {...}, "label": 0..3}

Production does not require LightGBM: V0 remains the fallback.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features import FEATURE_ORDER, extract_features
from schemas import CandidateSnapshot, HiringNeedSnapshot


def load_groups(path: Path):
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[str(row["need"]["id"])].append(row)
    return grouped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    parser.add_argument("--output", type=Path, default=Path("model.txt"))
    parser.add_argument("--metadata", type=Path, default=Path("model.meta.json"))
    args = parser.parse_args()

    try:
        import lightgbm as lgb
    except ImportError as exc:
        raise SystemExit(
            "LightGBM не входит в production dependencies. Установите requirements-ml.txt для offline training."
        ) from exc

    grouped = load_groups(args.dataset)
    x: list[list[float]] = []
    y: list[int] = []
    group_sizes: list[int] = []

    for rows in grouped.values():
        need = HiringNeedSnapshot.model_validate(rows[0]["need"])
        group_sizes.append(len(rows))
        for row in rows:
            candidate = CandidateSnapshot.model_validate(row["candidate"])
            x.append(extract_features(candidate, need))
            y.append(int(row["label"]))

    if not x:
        raise SystemExit("Dataset is empty")

    ranker = lgb.LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=180,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=10,
        reg_lambda=1.0,
        random_state=42,
    )
    ranker.fit(x, y, group=group_sizes)
    ranker.booster_.save_model(str(args.output))
    args.metadata.write_text(
        json.dumps(
            {
                "featureOrder": FEATURE_ORDER,
                "groups": len(group_sizes),
                "rows": len(x),
                "labels": sorted(set(y)),
                "note": "Use only after held-out benchmark proves uplift over rules-v1.",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"saved {args.output} and {args.metadata}")


if __name__ == "__main__":
    main()
