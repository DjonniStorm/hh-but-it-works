from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable


PII_PATTERNS: dict[str, re.Pattern[str]] = {
    "email": re.compile(r"(?i)\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b"),
    "phone": re.compile(r"(?<![0-9A-Za-z])(?:\+7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}(?![0-9A-Za-z])"),
    "snils": re.compile(r"(?<![0-9A-Za-z])\d{3}-\d{3}-\d{3}[ -]\d{2}(?![0-9A-Za-z])"),
    "passport": re.compile(r"(?<![0-9A-Za-z])\d{2}[\s-]?\d{2}[\s-]?\d{6}(?![0-9A-Za-z])"),
}


def pii_findings(value: Any, path: str = "$") -> list[str]:
    findings: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            findings.extend(pii_findings(item, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            findings.extend(pii_findings(item, f"{path}[{index}]"))
    elif isinstance(value, str):
        for name, pattern in PII_PATTERNS.items():
            if pattern.search(value):
                findings.append(f"{path}:{name}")
    return findings


def assert_no_pii(rows: Iterable[dict[str, Any]]) -> None:
    for number, row in enumerate(rows, start=1):
        findings = pii_findings(row)
        if findings:
            raise ValueError(f"line {number}: possible PII at {', '.join(findings)}")


def validate_label_metadata(row: dict[str, Any], number: int) -> None:
    for key in ("label", "qualificationLabel", "intentLabel"):
        value = row.get(key)
        if type(value) is not int or value not in {0, 1, 2, 3}:
            raise ValueError(f"line {number}: {key} must be an integer in 0..3")
    confidence = row.get("labelConfidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError(f"line {number}: labelConfidence must be numeric")
    if not math.isfinite(float(confidence)) or not 0 < float(confidence) <= 1:
        raise ValueError(f"line {number}: labelConfidence must be in (0, 1]")
    source = row.get("labelSource")
    if not isinstance(source, str) or not source.strip():
        raise ValueError(f"line {number}: labelSource is required")


def source_entities_by_group(rows: Iterable[dict[str, Any]]) -> dict[str, set[str]]:
    entities: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        entity = row.get("sourceEntityHash")
        if entity:
            entities[str(row["need"]["id"])].add(str(entity))
    return dict(entities)


def assert_entity_disjoint(*datasets: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    for index, rows in enumerate(datasets):
        current = {
            str(row["sourceEntityHash"])
            for row in rows
            if row.get("sourceEntityHash")
        }
        overlap = seen & current
        if overlap:
            raise ValueError(
                f"dataset {index} shares source entities with an earlier split"
            )
        seen.update(current)


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
