"""Build an open-vacancy-grounded controlled-synthetic LTR benchmark.

The vacancy side is derived from a small attributed public sample. Candidate
profiles are fictional and contain no personal data. Relevance labels come
from explicit qualification/intent scenarios, never from the rules ranker.
This makes the set useful for regression and end-to-end validation while still
requiring independent human judgments before production LTR activation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import CandidateSnapshot, HiringNeedSnapshot


DATA_DIR = ROOT / "evaluation/data"
SEEDS_FILE = DATA_DIR / "open_vacancy_seeds.jsonl"
GOLD_FILE = DATA_DIR / "gold.jsonl"
TRAIN_FILE = DATA_DIR / "gold_train.jsonl"
CALIBRATION_FILE = DATA_DIR / "gold_calibration.jsonl"
TEST_FILE = DATA_DIR / "gold_test.jsonl"
LABEL_SOURCE = "controlled_synthetic_v1"


SCENARIOS: tuple[dict[str, Any], ...] = (
    {"name": "verified_exact", "qualificationLabel": 3, "intentLabel": 3, "label": 3, "labelConfidence": 0.90, "skill_fraction": 1.0, "experience_delta": 2.0, "availability": "actively_looking", "freshness": 0.98, "salary_factor": 0.92, "verified": True, "semantic": 0.92},
    {"name": "qualified_low_intent", "qualificationLabel": 3, "intentLabel": 0, "label": 2, "labelConfidence": 0.82, "skill_fraction": 1.0, "experience_delta": 1.0, "availability": "passive", "freshness": 0.42, "salary_factor": 1.45, "verified": False, "semantic": 0.82},
    {"name": "promising_junior", "qualificationLabel": 2, "intentLabel": 3, "label": 2, "labelConfidence": 0.84, "skill_fraction": 0.67, "experience_delta": -0.5, "availability": "actively_looking", "freshness": 0.95, "salary_factor": 0.82, "verified": False, "semantic": 0.70},
    {"name": "adjacent_background", "qualificationLabel": 1, "intentLabel": 2, "label": 1, "labelConfidence": 0.76, "skill_fraction": 0.34, "experience_delta": 0.0, "availability": "open_to_offers", "freshness": 0.82, "salary_factor": 0.90, "verified": False, "semantic": 0.35, "adjacent": True},
    {"name": "underqualified_eager", "qualificationLabel": 0, "intentLabel": 3, "label": 0, "labelConfidence": 0.88, "skill_fraction": 0.0, "experience_delta": -3.0, "availability": "actively_looking", "freshness": 0.96, "salary_factor": 0.75, "verified": False, "semantic": 0.05},
    {"name": "overqualified_expensive", "qualificationLabel": 3, "intentLabel": 1, "label": 1, "labelConfidence": 0.78, "skill_fraction": 1.0, "experience_delta": 7.0, "availability": "passive", "freshness": 0.70, "salary_factor": 2.0, "verified": True, "semantic": 0.86},
    {"name": "unverified_exact", "qualificationLabel": 2, "intentLabel": 2, "label": 2, "labelConfidence": 0.72, "skill_fraction": 1.0, "experience_delta": 0.0, "availability": "open_to_offers", "freshness": 0.86, "salary_factor": 1.0, "verified": False, "semantic": 0.76},
    {"name": "different_profession", "qualificationLabel": 0, "intentLabel": 1, "label": 0, "labelConfidence": 0.95, "skill_fraction": 0.0, "experience_delta": 1.0, "availability": "open_to_offers", "freshness": 0.75, "salary_factor": 1.0, "verified": False, "semantic": -0.40, "adjacent": True},
)


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _stable_id(prefix: str, value: str) -> str:
    return f"{prefix}-{hashlib.sha256(value.encode('utf-8')).hexdigest()[:16]}"


def _grade(experience: float) -> str:
    if experience < 0.5:
        return "intern"
    if experience < 2:
        return "junior"
    if experience < 5:
        return "middle"
    return "senior"


def _salary_ceiling(seed: dict[str, Any]) -> int:
    return int(seed.get("salaryMax") or seed.get("salaryMin") or 50_000)


def _need(seed: dict[str, Any]) -> HiringNeedSnapshot:
    minimum_experience = float(seed.get("experienceMin") or 0)
    minimum_salary = seed.get("salaryMin")
    maximum_salary = seed.get("salaryMax") or minimum_salary
    return HiringNeedSnapshot.model_validate(
        {
            "id": _stable_id("need", seed["sourceVacancyId"]),
            "specialization": seed["specialization"],
            "gradeMin": _grade(minimum_experience),
            "mustSkills": seed["skills"],
            "niceSkills": seed.get("niceSkills", []),
            "competencyWeights": {
                skill: 1.0 for skill in seed["skills"]
            },
            "experienceMin": minimum_experience,
            "salaryMin": minimum_salary,
            "salaryMax": maximum_salary,
            "workModes": [seed["workMode"]],
            "locations": [seed["region"]],
            "employmentTypes": [seed["employmentType"]],
            "industries": [seed["industry"]],
            "strictSpecialization": False,
            "strictSalary": False,
            "strictWorkMode": False,
            "strictLocation": False,
            "strictMustSkills": False,
            "text": seed["text"],
        }
    )


def _candidate(seed: dict[str, Any], scenario: dict[str, Any], index: int) -> CandidateSnapshot:
    required = list(seed["skills"])
    skill_count = round(len(required) * float(scenario["skill_fraction"]))
    selected = required[:skill_count]
    verified = bool(scenario["verified"])
    experience = max(0.0, float(seed.get("experienceMin") or 0) + float(scenario["experience_delta"]))
    specialization = f"adjacent_{seed['industry']}" if scenario.get("adjacent") else seed["specialization"]
    ceiling = _salary_ceiling(seed)
    candidate_id = _stable_id("candidate", f"{seed['sourceVacancyId']}:{scenario['name']}:{index}")
    skills = []
    competencies: dict[str, float] = {}
    for skill_index, skill in enumerate(selected):
        level = max(0.45, 0.90 - skill_index * 0.08)
        item: dict[str, Any] = {
            "id": skill,
            "level": level,
            "confidence": 0.90 if verified else 0.62,
            "verified": verified,
            "years": experience,
        }
        if verified:
            item["evidence"] = [{"source": "assessment", "score": level, "confidence": 0.88, "title": "synthetic benchmark assessment"}]
        skills.append(item)
        competencies[skill] = level

    fsp_evidence = []
    if verified:
        fsp_evidence = [
            {
                "title": f"ФСП: {seed['title']} — {required[0]}",
                "year": 2025,
                "score": 0.86,
                "metadata": {"fictional": True},
            }
        ]

    return CandidateSnapshot.model_validate(
        {
            "id": candidate_id,
            "specialization": specialization,
            "claimedGrade": _grade(experience),
            "verifiedGrade": _grade(experience) if verified else None,
            "gradeConfidence": 0.90 if verified else 0.58,
            "experienceYears": experience,
            "skills": skills,
            "assessmentScore": 0.88 if verified else None,
            "competencies": competencies,
            "preferences": {
                "salaryMin": round(ceiling * float(scenario["salary_factor"])),
                "workModes": [seed["workMode"]],
                "locations": [seed["region"]],
                "relocation": False,
                "targetSpecializations": [specialization],
                "desiredSkills": selected,
                "employmentTypes": [seed["employmentType"]],
                "industries": [seed["industry"]],
            },
            "availability": scenario["availability"],
            "profileFreshness": scenario["freshness"],
            "semanticSimilarity": None,
            "profileText": " ".join(
                [specialization, *selected, f"опыт {experience:g} лет"]
            ),
            "fspEvidence": fsp_evidence,
            "metadata": {"fictional": True, "scenario": scenario["name"], "containsPersonalData": False},
        }
    )


def _split_group_ids(group_ids: list[str], train_ratio: float, calibration_ratio: float, seed: int) -> tuple[set[str], set[str], set[str]]:
    if train_ratio <= 0 or calibration_ratio <= 0:
        raise ValueError("train_ratio and calibration_ratio must be positive")
    if train_ratio + calibration_ratio >= 1:
        raise ValueError("ratios must leave a non-empty test share")
    if len(group_ids) < 3:
        raise ValueError("at least three groups are required")
    shuffled = sorted(group_ids)
    random.Random(seed).shuffle(shuffled)
    train_count = max(1, round(len(shuffled) * train_ratio))
    calibration_count = max(1, round(len(shuffled) * calibration_ratio))
    if train_count + calibration_count >= len(shuffled):
        calibration_count = 1
        train_count = len(shuffled) - 2
    calibration_end = train_count + calibration_count
    return set(shuffled[:train_count]), set(shuffled[train_count:calibration_end]), set(shuffled[calibration_end:])


def generate_gold_set(
    groups: int | None = None,
    per_group: int = len(SCENARIOS),
    train_ratio: float = 0.70,
    calibration_ratio: float = 0.15,
    seed: int = 42,
    seeds_path: Path = SEEDS_FILE,
) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    if per_group < 4 or per_group > len(SCENARIOS):
        raise ValueError(f"per_group must be between 4 and {len(SCENARIOS)}")
    seeds = _read_jsonl(seeds_path)
    if groups is not None:
        if groups < 3:
            raise ValueError("at least three groups are required")
        seeds = seeds[:groups]
    if len(seeds) < 3:
        raise ValueError("at least three groups are required")

    all_rows: list[dict] = []
    for seed_row in seeds:
        need = _need(seed_row)
        source_entity_hash = hashlib.sha256(seed_row["sourceVacancyId"].encode("utf-8")).hexdigest()
        for index, scenario in enumerate(SCENARIOS[:per_group]):
            candidate = _candidate(seed_row, scenario, index)
            all_rows.append(
                {
                    "need": need.model_dump(mode="json"),
                    "candidate": candidate.model_dump(mode="json"),
                    "label": scenario["label"],
                    "qualificationLabel": scenario["qualificationLabel"],
                    "intentLabel": scenario["intentLabel"],
                    "labelSource": LABEL_SOURCE,
                    "labelConfidence": scenario["labelConfidence"],
                    "scenario": scenario["name"],
                    "sourceEntityHash": source_entity_hash,
                    "sourceDate": seed_row["datePosted"],
                }
            )

    group_ids = sorted({str(row["need"]["id"]) for row in all_rows})
    train_ids, calibration_ids, test_ids = _split_group_ids(group_ids, train_ratio, calibration_ratio, seed)
    train_rows = [row for row in all_rows if row["need"]["id"] in train_ids]
    calibration_rows = [row for row in all_rows if row["need"]["id"] in calibration_ids]
    test_rows = [row for row in all_rows if row["need"]["id"] in test_ids]
    return all_rows, train_rows, calibration_rows, test_rows


def write_file(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def parse_args() -> argparse.Namespace:  # pragma: no cover - CLI wrapper
    parser = argparse.ArgumentParser()
    parser.add_argument("--groups", type=int)
    parser.add_argument("--per-group", type=int, default=len(SCENARIOS))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--seeds", type=Path, default=SEEDS_FILE)
    parser.add_argument("--output-dir", type=Path, default=DATA_DIR)
    return parser.parse_args()


def main() -> None:  # pragma: no cover - exercised by scripts/check_ml.sh
    args = parse_args()
    all_rows, train_rows, calibration_rows, test_rows = generate_gold_set(groups=args.groups, per_group=args.per_group, seed=args.seed, seeds_path=args.seeds)
    outputs = {"gold.jsonl": all_rows, "gold_train.jsonl": train_rows, "gold_calibration.jsonl": calibration_rows, "gold_test.jsonl": test_rows}
    for name, rows in outputs.items():
        write_file(args.output_dir / name, rows)
        print(f"{name}: {len(rows)} rows")


if __name__ == "__main__":
    main()
