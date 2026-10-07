from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scoring import rank_candidates

from fixtures import backend_need, synthetic_candidate


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=int, default=10000)
    parser.add_argument("--runs", type=int, default=5)
    args = parser.parse_args()

    need = backend_need(id="perf")
    candidates = [synthetic_candidate(i) for i in range(args.candidates)]

    timings = []
    for _ in range(args.runs):
        started = time.perf_counter()
        results = rank_candidates(candidates, need)
        timings.append(time.perf_counter() - started)
        assert len(results) == len(candidates)

    avg = sum(timings) / len(timings)
    throughput = args.candidates / avg if avg else 0
    print(f"candidates={args.candidates}")
    print(f"runs={args.runs}")
    print(f"avg_seconds={avg:.6f}")
    print(f"throughput_candidates_per_second={throughput:.2f}")


if __name__ == "__main__":
    main()
