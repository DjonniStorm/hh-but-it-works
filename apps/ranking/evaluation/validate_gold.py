from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import CandidateSnapshot, HiringNeedSnapshot


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    args = parser.parse_args()

    lines = [line for line in args.dataset.read_text(encoding="utf-8").splitlines() if line.strip()]
    groups: dict[str, list[dict]] = defaultdict(list)
    labels = Counter()
    pairs = set()

    for number, line in enumerate(lines, start=1):
        row = json.loads(line)
        candidate = CandidateSnapshot.model_validate(row["candidate"])
        need = HiringNeedSnapshot.model_validate(row["need"])
        label = int(row["label"])
        if label not in {0, 1, 2, 3}:
            raise SystemExit(f"line {number}: label must be 0..3")
        pair = (str(need.id), candidate.id)
        if pair in pairs:
            raise SystemExit(f"line {number}: duplicate pair {pair}")
        pairs.add(pair)
        groups[str(need.id)].append(row)
        labels[label] += 1

    if not groups:
        raise SystemExit("dataset is empty")

    no_positive = [gid for gid, rows in groups.items() if not any(int(r["label"]) >= 2 for r in rows)]
    print(f"rows={len(lines)}")
    print(f"groups={len(groups)}")
    print(f"labels={dict(sorted(labels.items()))}")
    print(f"groups_without_positive={len(no_positive)}")
    if no_positive:
        print("warning: some groups have no positive labels:", ", ".join(no_positive[:10]))


if __name__ == "__main__":
    main()
