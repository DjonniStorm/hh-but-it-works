from __future__ import annotations

import argparse
import random
import time
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import rank_candidates


def build_candidate(index: int) -> CandidateSnapshot:
    skills = [
        {"id": "python", "verified": True, "level": 0.8, "confidence": 0.9},
        {"id": "fastapi", "verified": index % 3 != 0, "level": 0.75, "confidence": 0.8},
    ]
    if index % 2 == 0:
        skills.append({"id": "postgresql", "verified": True, "level": 0.7, "confidence": 0.8})
    if index % 5 == 0:
        skills.append({"id": "docker", "verified": False, "level": 0.65, "confidence": 0.7})

    return CandidateSnapshot.model_validate({
        "id": f"c{index}",
        "specialization": "backend",
        "claimedGrade": "junior",
        "verifiedGrade": "junior" if index % 4 != 0 else None,
        "gradeConfidence": 0.8,
        "experienceYears": (index % 40) / 10,
        "skills": skills,
        "assessmentScore": 0.55 + (index % 40) / 100,
        "competencies": {
            "databases": 0.45 + (index % 50) / 100,
            "testing": 0.40 + (index % 45) / 100,
        },
        "preferences": {
            "salaryMin": 90000 + (index % 12) * 10000,
            "workModes": ["remote"] if index % 6 else ["office"],
            "targetSpecializations": ["backend"],
        },
        "availability": "actively_looking" if index % 3 else "open_to_offers",
        "profileFreshness": 0.65 + (index % 35) / 100,
        "semanticSimilarity": random.uniform(0.35, 0.95),
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=int, default=10000)
    parser.add_argument("--runs", type=int, default=5)
    args = parser.parse_args()

    need = HiringNeedSnapshot.model_validate({
        "id": "perf",
        "specialization": "backend",
        "gradeMin": "junior",
        "gradeMax": "middle",
        "mustSkills": ["python", "fastapi", "postgresql"],
        "niceSkills": ["docker", "redis"],
        "competencyWeights": {"databases": 0.7, "testing": 0.3},
        "experienceMin": 0.5,
        "salaryMin": 120000,
        "salaryMax": 220000,
        "workModes": ["remote"],
        "strictSalary": True,
        "strictWorkMode": True,
    })
    candidates = [build_candidate(i) for i in range(args.candidates)]

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
