import csv
import json
from pathlib import Path

import pytest

from evaluation.data_quality import assert_no_pii, pii_findings, validate_label_metadata
from evaluation.human_labels import export_template, import_annotations
from evaluation.open_data import clean_text, normalize_public_vacancy


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
            "candidate": {"id": "c1"},
            "label": 0,
        },
        {
            "need": {"id": "n1"},
            "candidate": {"id": "c2"},
            "label": 0,
        },
    ]
    path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
    return rows


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
    assert report == {"rows": 2, "pairwiseOverallAgreement": 1.0}
    imported = [json.loads(line) for line in output.read_text().splitlines()]
    assert all(row["labelSource"] == "human_double_annotation_v1" for row in imported)


def test_human_annotation_disagreement_requires_adjudication(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    _small_dataset(dataset)
    annotations = tmp_path / "annotations.csv"
    with annotations.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "need_id", "candidate_id", "annotator_id", "qualification_label",
            "intent_label", "overall_label", "confidence", "rationale",
        ])
        writer.writeheader()
        for candidate in ("c1", "c2"):
            for annotator, label in (("a", 2), ("b", 3)):
                writer.writerow({
                    "need_id": "n1", "candidate_id": candidate,
                    "annotator_id": annotator, "qualification_label": label,
                    "intent_label": label, "overall_label": label,
                    "confidence": 0.8, "rationale": "",
                })
    with pytest.raises(ValueError, match="adjudication"):
        import_annotations(dataset, annotations, tmp_path / "output.jsonl")
