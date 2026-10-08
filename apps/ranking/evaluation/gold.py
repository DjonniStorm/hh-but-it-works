import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from factories import backend_need, synthetic_candidate
from scoring import score_pair

DATA_DIR = ROOT / "evaluation/data"
GOLD_FILE = DATA_DIR / "gold.jsonl"
TRAIN_FILE = DATA_DIR / "gold_train.jsonl"
TEST_FILE = DATA_DIR / "gold_test.jsonl"


def generate_gold_set(
    groups: int = 20,
    per_group: int = 5,
    train_ratio: float = 0.8,
) -> tuple[list[dict], list[dict], list[dict]]:
    """Generate synthetic gold dataset and split into train/test."""
    all_rows = []
    groups_map: dict[str, list[dict]] = defaultdict(list)

    for group in range(groups):
        need = backend_need(id=f"n{group}")
        for index in range(per_group):
            candidate = synthetic_candidate(group * per_group + index)
            item = score_pair(candidate, need)
            # label based on matchScore (0..1) -> 0..3
            label = int(item.matchScore * 4)
            if label > 3:
                label = 3
            row = {
                "need": need.model_dump(mode="json"),
                "candidate": candidate.model_dump(mode="json"),
                "label": label,
            }
            groups_map[f"n{group}"].append(row)
            all_rows.append(row)

    # Split groups into train/test by group (not rows)
    train_rows, test_rows = [], []
    for group_id, rows in groups_map.items():
        if hash(group_id) % 100 < train_ratio * 100:  # deterministic split
            train_rows.extend(rows)
        else:
            test_rows.extend(rows)

    return all_rows, train_rows, test_rows


def write_file(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    print("Generating gold dataset...")
    all_rows, train_rows, test_rows = generate_gold_set(groups=20, per_group=5, train_ratio=0.8)
    write_file(GOLD_FILE, all_rows)
    write_file(TRAIN_FILE, train_rows)
    write_file(TEST_FILE, test_rows)
    print(f"Generated {len(all_rows)} rows total")
    print(f"  - gold: {len(all_rows)}")
    print(f"  - train: {len(train_rows)}")
    print(f"  - test: {len(test_rows)}")

    # Quick sanity: check that all groups have at least 2 rows
    groups = defaultdict(int)
    for row in all_rows:
        groups[row["need"]["id"]] += 1
    for group_id, count in groups.items():
        if count < 2:
            print(f"WARNING: group {group_id} has only {count} rows", file=sys.stderr)


if __name__ == "__main__":
    main()
