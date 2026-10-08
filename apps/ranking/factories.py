from __future__ import annotations

import random
from typing import Any

from schemas import CandidateSnapshot, HiringNeedSnapshot

# Один домен для юнит-тестов и eval-скриптов: бэкенд, python/fastapi/postgresql.
# Раньше эти числа жили в test_ranking.py, performance.py, examples/ и уже
# разъехались (competencyWeights 0.7/0.3 против 0.6/0.4, salaryMax 220000/190000).
BACKEND_MUST_SKILLS = ["python", "fastapi", "postgresql"]
BACKEND_NICE_SKILLS = ["docker", "redis"]


def candidate(**overrides: Any) -> CandidateSnapshot:
    """Базовый кандидат для юнит-тестов: один сильный профиль, дальше правим оверрайдом."""
    base: dict[str, Any] = {
        "id": "c1",
        "specialization": "backend",
        "claimedGrade": "junior",
        "verifiedGrade": "junior",
        "gradeConfidence": 0.9,
        "experienceYears": 1.0,
        "skills": [
            {"id": "Python", "verified": True, "level": 0.9, "confidence": 0.9},
            {"id": "FastAPI", "verified": True, "level": 0.85, "confidence": 0.9},
            {"id": "Postgres", "verified": True, "level": 0.75, "confidence": 0.85},
        ],
        "competencies": {"databases": 0.75, "testing": 0.7},
        "assessmentScore": 0.8,
        "preferences": {
            "salaryMin": 120000,
            "workModes": ["remote"],
            "targetSpecializations": ["backend"],
        },
        "availability": "actively_looking",
        "profileFreshness": 0.95,
    }
    base.update(overrides)
    return CandidateSnapshot.model_validate(base)


def need(**overrides: Any) -> HiringNeedSnapshot:
    """Базовая потребность для юнит-тестов: бэкенд, джуна-мидл, вилка 130–180."""
    base: dict[str, Any] = {
        "id": "n1",
        "specialization": "backend",
        "gradeMin": "junior",
        "gradeMax": "middle",
        "mustSkills": BACKEND_MUST_SKILLS,
        "niceSkills": ["docker"],
        "competencyWeights": {"databases": 0.6, "testing": 0.4},
        "experienceMin": 0.5,
        "salaryMin": 130000,
        "salaryMax": 180000,
        "workModes": ["remote"],
    }
    base.update(overrides)
    return HiringNeedSnapshot.model_validate(base)


def backend_need(**overrides: Any) -> HiringNeedSnapshot:
    """Потребность для eval: шире по навыкам и вилке, жёсткие бюджет и формат."""
    payload: dict[str, Any] = {
        "id": "perf",
        "specialization": "backend",
        "gradeMin": "junior",
        "gradeMax": "middle",
        "mustSkills": BACKEND_MUST_SKILLS,
        "niceSkills": BACKEND_NICE_SKILLS,
        "competencyWeights": {"databases": 0.7, "testing": 0.3},
        "experienceMin": 0.5,
        "salaryMin": 120000,
        "salaryMax": 220000,
        "workModes": ["remote"],
        "strictSalary": True,
        "strictWorkMode": True,
    }
    payload.update(overrides)
    return HiringNeedSnapshot.model_validate(payload)


def synthetic_candidate(index: int) -> CandidateSnapshot:
    """Синтетический кандидат для нагрузочного прогона: детерминирован по index, кроме semantic."""
    skills: list[dict[str, Any]] = [
        {"id": "python", "verified": True, "level": 0.8, "confidence": 0.9},
        {
            "id": "fastapi",
            "verified": index % 3 != 0,
            "level": 0.75,
            "confidence": 0.8,
        },
    ]
    if index % 2 == 0:
        skills.append(
            {"id": "postgresql", "verified": True, "level": 0.7, "confidence": 0.8},
        )
    if index % 5 == 0:
        skills.append(
            {"id": "docker", "verified": False, "level": 0.65, "confidence": 0.7},
        )

    return CandidateSnapshot.model_validate(
        {
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
        },
    )
