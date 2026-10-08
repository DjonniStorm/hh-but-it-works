"""Round-trip blind human annotation CSVs for an independent LTR gold set."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

try:
    from evaluation.data_quality import load_jsonl, validate_label_metadata
except ModuleNotFoundError:  # pragma: no cover - direct script import path
    from data_quality import load_jsonl, validate_label_metadata


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


def export_template(dataset: Path, output: Path) -> None:
    rows = load_jsonl(dataset)
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


def import_annotations(dataset: Path, annotations: Path, output: Path) -> dict[str, float | int]:
    base = {(row["need"]["id"], row["candidate"]["id"]): row for row in load_jsonl(dataset)}
    judgments: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    with annotations.open(encoding="utf-8", newline="") as handle:
        for line, row in enumerate(csv.DictReader(handle), start=2):
            key = (row["need_id"], row["candidate_id"])
            if key not in base:
                raise ValueError(f"line {line}: unknown need/candidate pair")
            if not row["annotator_id"].strip():
                raise ValueError(f"line {line}: annotator_id is required")
            judgments[key].append(row)

    output_rows = []
    agreements = []
    for key, source in base.items():
        pair_judgments = judgments.get(key, [])
        if len(pair_judgments) < 2:
            raise ValueError(f"pair {key} needs at least two independent judgments")
        annotators = [row["annotator_id"].strip() for row in pair_judgments]
        if len(set(annotators)) != len(annotators):
            raise ValueError(f"pair {key} has duplicate annotator_id")
        labels = [int(row["overall_label"]) for row in pair_judgments]
        qualification = [int(row["qualification_label"]) for row in pair_judgments]
        intent = [int(row["intent_label"]) for row in pair_judgments]
        if any(value not in {0, 1, 2, 3} for value in labels + qualification + intent):
            raise ValueError(f"pair {key} has a label outside 0..3")
        if len(set(labels)) != 1 or len(set(qualification)) != 1 or len(set(intent)) != 1:
            raise ValueError(f"pair {key} requires adjudication")
        confidence = sum(float(row["confidence"]) for row in pair_judgments) / len(pair_judgments)
        result = dict(source)
        result.update(
            {
                "label": labels[0],
                "qualificationLabel": qualification[0],
                "intentLabel": intent[0],
                "labelConfidence": confidence,
                "labelSource": "human_double_annotation_v1",
                "annotationCount": len(pair_judgments),
            }
        )
        validate_label_metadata(result, len(output_rows) + 1)
        output_rows.append(result)
        agreements.append(agreement(labels))

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in output_rows), encoding="utf-8")
    return {"rows": len(output_rows), "pairwiseOverallAgreement": sum(agreements) / len(agreements)}


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
    args = parser.parse_args()
    if args.command == "export":
        export_template(args.dataset, args.output)
    else:
        print(json.dumps(import_annotations(args.dataset, args.annotations, args.output), indent=2))


if __name__ == "__main__":
    main()
