from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from factories import backend_need, synthetic_candidate
from scoring import rank_candidates


def run(candidates: int, runs: int) -> dict[str, float]:
    """Прогоняет rank_candidates на синтетике и возвращает метрики скорости."""
    need = backend_need(id="perf")
    items = [synthetic_candidate(index) for index in range(candidates)]

    timings = []
    for _ in range(runs):
        started = time.perf_counter()
        results = rank_candidates(items, need)
        timings.append(time.perf_counter() - started)
        assert len(results) == len(items)

    avg = sum(timings) / len(timings)
    return {
        "candidates": float(candidates),
        "runs": float(runs),
        "avg_seconds": avg,
        "throughput": candidates / avg if avg else 0.0,
    }


BUDGET_PATH = Path(__file__).resolve().parent / "performance_budget.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--budget", type=Path, default=BUDGET_PATH)
    parser.add_argument("--candidates", type=int)
    parser.add_argument("--runs", type=int)
    parser.add_argument("--max-avg-seconds", type=float)
    args = parser.parse_args()

    budget = json.loads(args.budget.read_text(encoding="utf-8")) if args.budget.exists() else {}
    candidates = args.candidates if args.candidates is not None else budget.get("candidates", 10000)
    runs = args.runs if args.runs is not None else budget.get("runs", 5)
    limit = (
        args.max_avg_seconds
        if args.max_avg_seconds is not None
        else budget.get("maxAvgSeconds")
    )

    stats = run(candidates, runs)
    print(f"candidates={int(stats['candidates'])}")
    print(f"runs={int(stats['runs'])}")
    print(f"avg_seconds={stats['avg_seconds']:.6f}")
    print(f"throughput_candidates_per_second={stats['throughput']:.2f}")

    if limit is not None and stats["avg_seconds"] > limit:
        print(
            f"avg_seconds={stats['avg_seconds']:.6f} превышает бюджет {limit} "
            f"(evaluation/performance_budget.json)",
            file=sys.stderr,
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
