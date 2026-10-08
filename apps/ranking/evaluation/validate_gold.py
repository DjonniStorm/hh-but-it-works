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
from evaluation.data_quality import (
    assert_entity_disjoint,
    assert_no_pii,
    load_jsonl,
    validate_label_metadata,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    parser.add_argument(
        "--disjoint-with",
        type=Path,
        action="append",
        default=[],
        help="also reject group/source-entity overlap with these JSONL files",
    )
    args = parser.parse_args()

    rows = load_jsonl(args.dataset)
    assert_no_pii(rows)
    has_rich_labels = any("labelConfidence" in row for row in rows)
    groups: dict[str, list[dict]] = defaultdict(list)
    labels = Counter()
    pairs = set()
    need_payloads: dict[str, str] = {}

    for number, row in enumerate(rows, start=1):
        candidate = CandidateSnapshot.model_validate(row["candidate"])
        need = HiringNeedSnapshot.model_validate(row["need"])
        if need.id is None:
            raise SystemExit(f"line {number}: need.id is required for grouped ranking")
        label = int(row["label"])
        if label not in {0, 1, 2, 3}:
            raise SystemExit(f"line {number}: label must be 0..3")
        pair = (str(need.id), candidate.id)
        if pair in pairs:
            raise SystemExit(f"line {number}: duplicate pair {pair}")
        pairs.add(pair)
        group_id = str(need.id)
        serialized_need = json.dumps(row["need"], ensure_ascii=False, sort_keys=True)
        if group_id in need_payloads and need_payloads[group_id] != serialized_need:
            raise SystemExit(f"line {number}: need payload changed inside group {group_id}")
        need_payloads[group_id] = serialized_need
        groups[group_id].append(row)
        labels[label] += 1
        if has_rich_labels:
            validate_label_metadata(row, number)

    if not groups:
        raise SystemExit("dataset is empty")

    too_small = [gid for gid, rows in groups.items() if len(rows) < 2]
    if too_small:
        raise SystemExit("groups with fewer than two candidates: " + ", ".join(too_small[:10]))

    no_positive = [gid for gid, rows in groups.items() if not any(int(r["label"]) >= 2 for r in rows)]
    no_contrast = [gid for gid, rows in groups.items() if len({int(r["label"]) for r in rows}) < 2]
    for other_path in args.disjoint_with:
        other_rows = load_jsonl(other_path)
        current_groups = {str(row["need"]["id"]) for row in rows}
        other_groups = {str(row["need"]["id"]) for row in other_rows}
        if current_groups & other_groups:
            raise SystemExit(f"group overlap with {other_path}")
        try:
            assert_entity_disjoint(rows, other_rows)
        except ValueError as exc:
            raise SystemExit(f"source-entity overlap with {other_path}: {exc}") from exc

    print(f"rows={len(rows)}")
    print(f"groups={len(groups)}")
    print(f"labels={dict(sorted(labels.items()))}")
    print(f"groups_without_positive={len(no_positive)}")
    if has_rich_labels:
        sources = Counter(str(row["labelSource"]) for row in rows)
        print(f"label_sources={dict(sorted(sources.items()))}")
        print("pii_findings=0")
    if no_positive:
        raise SystemExit("groups without positive labels: " + ", ".join(no_positive[:10]))
    if no_contrast:
        raise SystemExit("groups without label contrast: " + ", ".join(no_contrast[:10]))


if __name__ == "__main__":
    main()
