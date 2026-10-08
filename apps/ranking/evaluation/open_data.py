"""Normalize local exports of public vacancy data without network coupling."""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Any

try:
    from evaluation.data_quality import assert_no_pii
except ModuleNotFoundError:  # pragma: no cover - direct script import path
    from data_quality import assert_no_pii


TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def clean_text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    return SPACE_RE.sub(" ", TAG_RE.sub(" ", text)).strip()


def _first(payload: dict[str, Any], *paths: str) -> Any:
    for path in paths:
        value: Any = payload
        for part in path.split("."):
            if not isinstance(value, dict) or part not in value:
                value = None
                break
            value = value[part]
        if value not in (None, ""):
            return value
    return None


def normalize_public_vacancy(payload: dict[str, Any]) -> dict[str, Any]:
    """Map common Trudvsem/DataCrafter fields to a PII-free staging record."""
    record = {
        "sourceVacancyId": str(_first(payload, "id", "vacancy.id") or "").strip(),
        "datePosted": str(_first(payload, "datePosted", "creation-date", "vacancy.creation-date") or "")[:10],
        "title": clean_text(_first(payload, "title", "job-name", "vacancy.job-name")),
        "industry": clean_text(_first(payload, "industry", "category.specialisation", "vacancy.category.specialisation")),
        "salaryMin": _first(payload, "salaryMin", "salary_min", "vacancy.salary_min"),
        "salaryMax": _first(payload, "salaryMax", "salary_max", "vacancy.salary_max"),
        "employmentType": clean_text(_first(payload, "employmentType", "employment", "vacancy.employment")),
        "workMode": clean_text(_first(payload, "workMode", "work_hours", "vacancy.work_hours")),
        "region": clean_text(_first(payload, "region.name", "vacancy.region.name", "region")),
        "experienceMin": _first(payload, "experienceMin", "requirement.experience", "vacancy.requirement.experience") or 0,
        "text": clean_text(
            " ".join(
                filter(
                    None,
                    [
                        clean_text(_first(payload, "requirement.qualification", "vacancy.requirement.qualification")),
                        clean_text(_first(payload, "duty", "vacancy.duty")),
                    ],
                )
            )
        ),
    }
    if not record["sourceVacancyId"] or not record["title"]:
        raise ValueError("vacancy id and title are required")
    # Deliberately exclude company, full address, coordinates and contact fields.
    assert_no_pii([record])
    return record


def parse_args() -> argparse.Namespace:  # pragma: no cover - CLI wrapper
    parser = argparse.ArgumentParser(description="Normalize a downloaded public vacancy JSON export")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def main() -> None:  # pragma: no cover - exercised by scripts/check_ml.sh
    args = parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    source_rows = payload if isinstance(payload, list) else payload.get("results") or payload.get("vacancies") or [payload]
    rows = [normalize_public_vacancy(row) for row in source_rows]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
    print(f"normalized={len(rows)}")


if __name__ == "__main__":
    main()
