"""Round-trip blind human annotation CSVs for an independent LTR gold set."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

try:
    from evaluation.data_quality import load_jsonl, pii_findings, validate_label_metadata
except ModuleNotFoundError:  # pragma: no cover - direct script import path
    from data_quality import load_jsonl, pii_findings, validate_label_metadata


FIELDS = [
    "need_id",
    "candidate_id",
    "annotator_id",
    "qualification_label",
    "intent_label",
    "overall_label",
    "confidence",
    "rationale",
]

ADJUDICATOR_PREFIX = "adjudicator:"
SCALE_VERSION = "labels-v1"
LABEL_VALUES = {0, 1, 2, 3}
HUMAN_SOURCE = "human_double_annotation_v1"
LLM_SOURCE = "llm_judge_v1"
KNOWN_SOURCES = {HUMAN_SOURCE, LLM_SOURCE}


def dataset_digest(dataset: Path) -> str:
    return hashlib.sha256(dataset.read_bytes()).hexdigest()


def export_template(dataset: Path, output: Path) -> dict[str, Any]:
    rows = load_jsonl(dataset)
    if not rows:
        raise ValueError(f"{dataset} has no pairs to export")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "need_id": row["need"]["id"],
                    "candidate_id": row["candidate"]["id"],
                    "annotator_id": "",
                    "qualification_label": "",
                    "intent_label": "",
                    "overall_label": "",
                    "confidence": "",
                    "rationale": "",
                }
            )
    group_sizes = Counter(row["need"]["id"] for row in rows)
    manifest: dict[str, Any] = {
        "dataset": dataset.as_posix(),
        "datasetSha256": dataset_digest(dataset),
        "rows": len(rows),
        "needs": len(group_sizes),
        "candidatesPerNeed": {"min": min(group_sizes.values()), "max": max(group_sizes.values())},
        "fields": FIELDS,
        "annotatorsRequired": 2,
        "adjudicatorIdPrefix": ADJUDICATOR_PREFIX,
        "scaleVersion": SCALE_VERSION,
        "scale": {
            "qualification_label": "0..3",
            "intent_label": "0..3",
            "overall_label": "0..3",
        },
    }
    manifest_path = output.parent / f"{output.stem}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def agreement(labels: list[int]) -> float:
    if len(labels) < 2:
        return 1.0
    pairs = 0
    matches = 0
    for left in range(len(labels)):
        for right in range(left + 1, len(labels)):
            pairs += 1
            matches += labels[left] == labels[right]
    return matches / pairs


def _labels(rows: list[dict[str, str]], field: str) -> list[int]:
    values: list[int] = []
    for row in rows:
        try:
            values.append(int(row[field]))
        except (KeyError, TypeError, ValueError):
            raise ValueError(f"{field} must be an integer in 0..3") from None
    return values


def import_annotations(
    dataset: Path,
    annotations: Path,
    output: Path,
    min_agreement: float = 0.6,
    label_source: str = HUMAN_SOURCE,
    min_annotators: int = 2,
) -> dict[str, Any]:
    if not 0.0 <= min_agreement <= 1.0:
        raise ValueError("min_agreement must be within [0, 1]")
    if label_source not in KNOWN_SOURCES:
        raise ValueError(f"label_source must be one of {sorted(KNOWN_SOURCES)}")
    if min_annotators < 1:
        raise ValueError("min_annotators must be at least 1")
    if label_source == HUMAN_SOURCE and min_annotators < 2:
        raise ValueError(f"{HUMAN_SOURCE} requires at least two annotators per pair")
    base = {(row["need"]["id"], row["candidate"]["id"]): row for row in load_jsonl(dataset)}
    if not base:
        raise ValueError(f"{dataset} has no pairs")
    group_sizes = Counter(need_id for need_id, _ in base)
    for need_id, size in group_sizes.items():
        if size < 2:
            raise ValueError(f"need {need_id} has fewer than two labeled candidates; ranking needs groups")
    judgments: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    with annotations.open(encoding="utf-8", newline="") as handle:
        for line, row in enumerate(csv.DictReader(handle), start=2):
            key = (row["need_id"].strip(), row["candidate_id"].strip())
            if key not in base:
                raise ValueError(f"line {line}: unknown need/candidate pair")
            if not row["annotator_id"].strip():
                raise ValueError(f"line {line}: annotator_id is required")
            findings = pii_findings({"annotator_id": row["annotator_id"], "rationale": row["rationale"]})
            if findings:
                raise ValueError(f"line {line}: possible PII in annotation: {', '.join(findings)}")
            judgments[key].append(row)

    output_rows: list[dict[str, Any]] = []
    agreements: list[float] = []
    annotator_ids: set[str] = set()
    adjudicated_pairs = 0
    label_histogram: Counter[int] = Counter()
    for key, source in base.items():
        pair_judgments = judgments.get(key, [])
        annotators = [
            row for row in pair_judgments if not row["annotator_id"].strip().startswith(ADJUDICATOR_PREFIX)
        ]
        adjudicators = [
            row for row in pair_judgments if row["annotator_id"].strip().startswith(ADJUDICATOR_PREFIX)
        ]
        if len(annotators) < min_annotators:
            raise ValueError(f"pair {key} needs at least {min_annotators} independent judgments")
        annotator_names = [row["annotator_id"].strip() for row in annotators]
        if len(set(annotator_names)) != len(annotator_names):
            raise ValueError(f"pair {key} has duplicate annotator_id")
        annotator_ids.update(annotator_names)
        labels = _labels(annotators, "overall_label")
        qualification = _labels(annotators, "qualification_label")
        intent = _labels(annotators, "intent_label")
        if any(value not in LABEL_VALUES for value in labels + qualification + intent):
            raise ValueError(f"pair {key} has a label outside 0..3")
        pair_agreement = agreement(labels)
        agreements.append(pair_agreement)
        if len(set(labels)) == 1 and len(set(qualification)) == 1 and len(set(intent)) == 1:
            if adjudicators:
                raise ValueError(f"pair {key} has adjudicator rows but the annotators agree")
            final = (labels[0], qualification[0], intent[0])
        else:
            if not adjudicators:
                raise ValueError(f"pair {key} requires adjudication")
            adjudicator_names = [row["annotator_id"].strip() for row in adjudicators]
            if len(set(adjudicator_names)) != len(adjudicator_names):
                raise ValueError(f"pair {key} has duplicate adjudicator_id")
            adj_labels = _labels(adjudicators, "overall_label")
            adj_qualification = _labels(adjudicators, "qualification_label")
            adj_intent = _labels(adjudicators, "intent_label")
            if any(value not in LABEL_VALUES for value in adj_labels + adj_qualification + adj_intent):
                raise ValueError(f"pair {key} has an adjudication label outside 0..3")
            if len(set(adj_labels)) != 1 or len(set(adj_qualification)) != 1 or len(set(adj_intent)) != 1:
                raise ValueError(f"pair {key} requires a single adjudicator decision")
            final = (adj_labels[0], adj_qualification[0], adj_intent[0])
            adjudicated_pairs += 1
        confidence = sum(float(row["confidence"]) for row in annotators) / len(annotators)
        result = dict(source)
        result.update(
            {
                "label": final[0],
                "qualificationLabel": final[1],
                "intentLabel": final[2],
                "labelConfidence": confidence,
                "labelSource": label_source,
                "annotationCount": len(pair_judgments),
                "adjudicated": bool(adjudicators),
            }
        )
        validate_label_metadata(result, len(output_rows) + 1)
        output_rows.append(result)
        label_histogram[final[0]] += 1

    mean_agreement = sum(agreements) / len(agreements)
    if mean_agreement < min_agreement:
        raise ValueError(
            f"pairwise agreement {mean_agreement:.2f} is below the required {min_agreement:.2f}; "
            "send the disputed pairs back to adjudication"
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in output_rows), encoding="utf-8")
    return {
        "rows": len(output_rows),
        "needs": len(group_sizes),
        "annotators": len(annotator_ids),
        "adjudicatedPairs": adjudicated_pairs,
        "labelSource": label_source,
        "pairwiseOverallAgreement": mean_agreement,
        "labelHistogram": {str(value): label_histogram.get(value, 0) for value in sorted(LABEL_VALUES)},
    }


def main() -> None:  # pragma: no cover - CLI wrapper
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    export = subparsers.add_parser("export")
    export.add_argument("dataset", type=Path)
    export.add_argument("output", type=Path)
    ingest = subparsers.add_parser("import")
    ingest.add_argument("dataset", type=Path)
    ingest.add_argument("annotations", type=Path)
    ingest.add_argument("output", type=Path)
    ingest.add_argument("--min-agreement", type=float, default=0.6)
    ingest.add_argument("--label-source", default=HUMAN_SOURCE, choices=sorted(KNOWN_SOURCES))
    ingest.add_argument("--min-annotators", type=int, default=2)
    args = parser.parse_args()
    if args.command == "export":
        print(json.dumps(export_template(args.dataset, args.output), indent=2))
    else:
        report = import_annotations(
            args.dataset,
            args.annotations,
            args.output,
            min_agreement=args.min_agreement,
            label_source=args.label_source,
            min_annotators=args.min_annotators,
        )
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
