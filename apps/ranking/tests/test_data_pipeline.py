import csv
import hashlib
import json
from pathlib import Path

import pytest

from evaluation.data_quality import assert_no_pii, load_jsonl, pii_findings, validate_label_metadata
from evaluation.human_labels import FIELDS, export_template, import_annotations
from evaluation.open_data import clean_text, normalize_public_vacancy

ROOT = Path(__file__).resolve().parents[1]
GOLD_DATASET = ROOT / "evaluation" / "data" / "gold.jsonl"
BATCH_DIR = ROOT / "evaluation" / "annotation" / "batch-001"


def test_pii_detector_catches_high_precision_identifiers():
    assert any("email" in item for item in pii_findings({"text": "mail me at user@example.org"}))
    assert any("phone" in item for item in pii_findings({"text": "+7 (999) 123-45-67"}))
    assert any("snils" in item for item in pii_findings({"text": "112-233-445 95"}))
    with pytest.raises(ValueError, match="possible PII"):
        assert_no_pii([{"contact": "8 999 123 45 67"}])


def test_html_cleaner_and_public_vacancy_normalizer_drop_sensitive_fields():
    payload = {
        "id": "vac-1",
        "creation-date": "2026-01-02T10:00:00Z",
        "job-name": "<b>Python developer</b>",
        "salary_min": 100000,
        "salary_max": 150000,
        "employment": "Полная занятость",
        "work_hours": "Удаленная работа",
        "region": {"name": "Самарская область"},
        "requirement": {"experience": 2, "qualification": "Python &amp; SQL"},
        "duty": "<p>Разработка API</p>",
        "company": {"name": "must not leak"},
        "contact": {"email": "private@example.org"},
        "addresses": {"address": [{"location": "exact address"}]},
    }
    record = normalize_public_vacancy(payload)
    assert record["title"] == "Python developer"
    assert record["text"] == "Python & SQL Разработка API"
    assert record["region"] == "Самарская область"
    assert "company" not in record and "contact" not in record and "addresses" not in record
    assert clean_text("<p>a&nbsp; b</p>") == "a b"


def test_rich_label_validation_rejects_bad_confidence():
    row = {
        "label": 2,
        "qualificationLabel": 3,
        "intentLabel": 1,
        "labelSource": "human",
        "labelConfidence": 0,
    }
    with pytest.raises(ValueError, match="labelConfidence"):
        validate_label_metadata(row, 1)


def _small_dataset(path: Path) -> list[dict]:
    rows = [
        {
            "need": {"id": "n1"},
            "candidate": {"id": candidate},
            "label": 0,
        }
        for candidate in ("c1", "c2")
    ]
    path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
    return rows


def _write_annotations(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _annotation(annotator: str, candidate: str, labels: tuple[int, int, int], confidence: float = 0.8) -> dict:
    return {
        "need_id": "n1",
        "candidate_id": candidate,
        "annotator_id": annotator,
        "qualification_label": str(labels[0]),
        "intent_label": str(labels[1]),
        "overall_label": str(labels[2]),
        "confidence": str(confidence),
        "rationale": "good fit",
    }


def test_export_writes_manifest_with_dataset_digest(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    template = tmp_path / "pairs.csv"
    manifest = export_template(dataset, template)
    assert manifest["datasetSha256"] == hashlib.sha256(dataset.read_bytes()).hexdigest()
    assert manifest["rows"] == 2
    assert manifest["needs"] == 1
    assert manifest["candidatesPerNeed"] == {"min": 2, "max": 2}
    assert manifest["fields"] == FIELDS
    stored = json.loads((tmp_path / "pairs.manifest.json").read_text(encoding="utf-8"))
    assert stored == manifest


def test_export_rejects_empty_dataset(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    dataset.write_text("", encoding="utf-8")
    with pytest.raises(ValueError, match="no pairs"):
        export_template(dataset, tmp_path / "pairs.csv")


def test_human_annotation_requires_double_agreement(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    rows = _small_dataset(dataset)
    template = tmp_path / "template.csv"
    export_template(dataset, template)
    with template.open(encoding="utf-8", newline="") as handle:
        template_rows = list(csv.DictReader(handle))
    assert len(template_rows) == 2
    annotations = tmp_path / "annotations.csv"
    with annotations.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(template_rows[0]))
        writer.writeheader()
        for item in rows:
            for annotator in ("a", "b"):
                writer.writerow(
                    {
                        "need_id": item["need"]["id"],
                        "candidate_id": item["candidate"]["id"],
                        "annotator_id": annotator,
                        "qualification_label": 3,
                        "intent_label": 2,
                        "overall_label": 2,
                        "confidence": 0.8,
                        "rationale": "good fit",
                    }
                )
    output = tmp_path / "human.jsonl"
    report = import_annotations(dataset, annotations, output)
    assert report["rows"] == 2
    assert report["needs"] == 1
    assert report["annotators"] == 2
    assert report["adjudicatedPairs"] == 0
    assert report["pairwiseOverallAgreement"] == 1.0
    assert report["labelHistogram"] == {"0": 0, "1": 0, "2": 2, "3": 0}
    imported = [json.loads(line) for line in output.read_text().splitlines()]
    assert all(row["labelSource"] == "human_double_annotation_v1" for row in imported)
    assert all(row["adjudicated"] is False for row in imported)


def test_human_annotation_disagreement_requires_adjudication(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    with annotations.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for candidate in ("c1", "c2"):
            for annotator, label in (("a", 2), ("b", 3)):
                writer.writerow(
                    {
                        "need_id": "n1",
                        "candidate_id": candidate,
                        "annotator_id": annotator,
                        "qualification_label": label,
                        "intent_label": label,
                        "overall_label": label,
                        "confidence": 0.8,
                        "rationale": "",
                    }
                )
    with pytest.raises(ValueError, match="adjudication"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")


def test_adjudicator_resolves_conflicts_and_reports_agreement(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("a", "c1", (3, 3, 3)),
            _annotation("b", "c1", (2, 2, 2)),
            _annotation("a", "c2", (2, 2, 2)),
            _annotation("b", "c2", (2, 2, 2)),
            _annotation("adjudicator:x", "c1", (3, 3, 3), confidence=0.9),
        ],
    )
    output = tmp_path / "human.jsonl"
    report = import_annotations(dataset, annotations, output, min_agreement=0.4)
    assert report["adjudicatedPairs"] == 1
    assert report["pairwiseOverallAgreement"] == 0.5
    imported = {row["candidate"]["id"]: row for row in map(json.loads, output.read_text().splitlines())}
    assert imported["c1"]["label"] == 3 and imported["c1"]["qualificationLabel"] == 3
    assert imported["c1"]["adjudicated"] is True
    assert imported["c2"]["adjudicated"] is False


def test_min_agreement_gate_blocks_low_consensus_batch(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("a", "c1", (3, 3, 3)),
            _annotation("b", "c1", (2, 2, 2)),
            _annotation("a", "c2", (2, 2, 2)),
            _annotation("b", "c2", (2, 2, 2)),
            _annotation("adjudicator:x", "c1", (3, 3, 3)),
        ],
    )
    with pytest.raises(ValueError, match="below the required 0.60"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")
    with pytest.raises(ValueError, match="min_agreement"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl", min_agreement=1.5)


def test_llm_judge_import_accepts_single_annotator(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("llm-judge", "c1", (3, 2, 2)),
            _annotation("llm-judge", "c2", (2, 2, 2)),
        ],
    )
    output = tmp_path / "llm.jsonl"
    report = import_annotations(
        dataset,
        annotations,
        output,
        label_source="llm_judge_v1",
        min_annotators=1,
    )
    assert report["labelSource"] == "llm_judge_v1"
    assert report["annotators"] == 1
    assert report["pairwiseOverallAgreement"] == 1.0
    imported = [json.loads(line) for line in output.read_text().splitlines()]
    assert all(row["labelSource"] == "llm_judge_v1" for row in imported)


def test_human_source_rejects_single_annotator_and_unknown_source(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("llm-judge", "c1", (3, 2, 2)),
            _annotation("llm-judge", "c2", (2, 2, 2)),
        ],
    )
    with pytest.raises(ValueError, match="at least two annotators"):
        import_annotations(dataset, annotations, tmp_path / "out.jsonl", min_annotators=1)
    with pytest.raises(ValueError, match="label_source"):
        import_annotations(
            dataset,
            annotations,
            tmp_path / "out.jsonl",
            label_source="gpt_vibes",
            min_annotators=1,
        )


def test_adjudicator_rows_are_rejected_when_annotators_agree(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("a", "c1", (2, 2, 2)),
            _annotation("b", "c1", (2, 2, 2)),
            _annotation("a", "c2", (2, 2, 2)),
            _annotation("b", "c2", (2, 2, 2)),
            _annotation("adjudicator:x", "c1", (3, 2, 2)),
        ],
    )
    with pytest.raises(ValueError, match="annotators agree"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")


def test_conflicting_adjudicators_are_rejected(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    _write_annotations(
        annotations,
        [
            _annotation("a", "c1", (3, 3, 3)),
            _annotation("b", "c1", (2, 2, 2)),
            _annotation("a", "c2", (2, 2, 2)),
            _annotation("b", "c2", (2, 2, 2)),
            _annotation("adjudicator:x", "c1", (3, 3, 3)),
            _annotation("adjudicator:y", "c1", (2, 2, 2)),
        ],
    )
    with pytest.raises(ValueError, match="single adjudicator decision"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")


def test_import_rejects_pii_in_annotation_text(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    rows = [
        _annotation("a", "c1", (2, 2, 2)),
        _annotation("b", "c1", (2, 2, 2)),
        _annotation("a", "c2", (2, 2, 2)),
        _annotation("b", "c2", (2, 2, 2)),
    ]
    rows[1]["rationale"] = "mail me at user@example.org"
    _write_annotations(annotations, rows)
    with pytest.raises(ValueError, match="possible PII in annotation"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")
    rows[1]["rationale"] = "good fit"
    rows[0]["annotator_id"] = "+7 (999) 123-45-67"
    _write_annotations(annotations, rows)
    with pytest.raises(ValueError, match="possible PII in annotation"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")


def test_import_requires_groups_with_two_candidates(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    rows = [
        {"need": {"id": "n1"}, "candidate": {"id": "c1"}, "label": 0},
        {"need": {"id": "n1"}, "candidate": {"id": "c2"}, "label": 0},
        {"need": {"id": "n2"}, "candidate": {"id": "c9"}, "label": 0},
    ]
    dataset.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
    annotations = tmp_path / "annotations.csv"
    labeled: list[dict] = []
    for candidate in ("c1", "c2"):
        for annotator in ("a", "b"):
            labeled.append(_annotation(annotator, candidate, (2, 2, 2)))
    _write_annotations(annotations, labeled)
    with pytest.raises(ValueError, match="fewer than two labeled candidates"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")


def test_committed_batch_001_matches_gold_dataset():
    manifest = json.loads((BATCH_DIR / "pairs.manifest.json").read_text(encoding="utf-8"))
    assert manifest["dataset"] == "evaluation/data/gold.jsonl"
    assert manifest["datasetSha256"] == hashlib.sha256(GOLD_DATASET.read_bytes()).hexdigest()
    assert manifest["rows"] == 168
    assert manifest["needs"] == 21
    with (BATCH_DIR / "pairs.csv").open(encoding="utf-8", newline="") as handle:
        pairs = list(csv.DictReader(handle))
    assert len(pairs) == manifest["rows"]
    assert list(pairs[0]) == FIELDS
    gold_pairs = {(row["need"]["id"], row["candidate"]["id"]) for row in load_jsonl(GOLD_DATASET)}
    assert {(row["need_id"], row["candidate_id"]) for row in pairs} == gold_pairs
