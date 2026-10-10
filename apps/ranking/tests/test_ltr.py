import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

import pytest

from evaluation.features import FEATURE_ORDER, extract_features, model_code_sha256
from evaluation.train_ltr import load_groups
from factories import backend_need, candidate, synthetic_candidate
from ltr import LTRRanker
from schemas import CandidateSnapshot, HiringNeedSnapshot
from scoring import score_pair

ROOT = Path(__file__).resolve().parents[1]
TRAIN = ROOT / "evaluation/train_ltr.py"


def _dataset(
    tmp_path: Path,
    groups: int = 6,
    per_group: int = 10,
    group_offset: int = 0,
    name: str = "gold.jsonl",
) -> Path:
    """Синтетический gold: метки вычисляются текущей формулой, чтобы ранкер учился на чем-то осмысленном."""
    rows = []
    for group in range(group_offset, group_offset + groups):
        need = backend_need(id=f"n{group}")
        for index in range(per_group):
            item = synthetic_candidate(group * per_group + index)
            score = score_pair(item, need).matchScore
            rows.append({
                "need": need.model_dump(mode="json"),
                "candidate": item.model_dump(mode="json"),
                "label": min(3, int(score * 4)),
            })
    path = tmp_path / name
    path.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in rows),
        encoding="utf-8",
    )
    return path


def test_extract_features_returns_one_value_per_feature():
    features = extract_features(candidate(), backend_need())
    assert len(features) == len(FEATURE_ORDER)
    assert all(isinstance(value, float) for value in features)


def test_extract_features_are_finite_and_in_range():
    features = extract_features(synthetic_candidate(7), backend_need())
    assert all(value == value and abs(value) != float("inf") for value in features)
    # Компоненты score_pair не выходят за пределы [0, 1] — признаки обязаны следовать.
    assert all(0.0 <= value <= 1.0 for value in features)


def test_extract_features_is_deterministic():
    item, need = synthetic_candidate(3), backend_need()
    assert extract_features(item, need) == extract_features(item, need)


def test_feature_order_covers_every_score_component():
    from schemas import ScoreBreakdown

    assert FEATURE_ORDER[: len(ScoreBreakdown.model_fields)] == list(ScoreBreakdown.model_fields)
    assert FEATURE_ORDER[-4:] == [
        "qualificationScore",
        "opportunityFit",
        "intentScore",
        "rulesMatchScore",
    ]


def test_load_groups_splits_rows_by_need_id(tmp_path):
    path = _dataset(tmp_path, groups=3, per_group=4)
    grouped = load_groups(path)
    assert len(grouped) == 3
    assert all(len(rows) == 4 for rows in grouped.values())


@pytest.mark.ml
def test_train_ltr_writes_model_and_metadata(tmp_path):
    pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    dataset = _dataset(tmp_path)
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"

    result = subprocess.run(
        [sys.executable, str(TRAIN), str(dataset), "--output", str(model), "--metadata", str(metadata)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    meta = json.loads(metadata.read_text(encoding="utf-8"))
    assert meta["featureOrder"] == FEATURE_ORDER
    assert meta["modelCodeSha256"] == model_code_sha256()
    assert meta["groups"] == 6
    assert meta["rows"] == 60
    assert meta["labels"] and max(meta["labels"]) > 0
    assert model.stat().st_size > 0


@pytest.mark.ml
def test_trained_model_scores_every_row(tmp_path):
    lgb = pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    dataset = _dataset(tmp_path)
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"

    result = subprocess.run(
        [sys.executable, str(TRAIN), str(dataset), "--output", str(model), "--metadata", str(metadata)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    booster = lgb.Booster(model_file=str(model))
    grouped = load_groups(dataset)
    scores = []
    for rows in grouped.values():
        need = rows[0]["need"]
        for row in rows:
            features = extract_features(
                CandidateSnapshot.model_validate(row["candidate"]),
                HiringNeedSnapshot.model_validate(need),
            )
            scores.append(booster.predict([features])[0])

    assert len(scores) == 60
    assert all(score == score for score in scores)
    # Порядок бустинга коррелирует с исходной оценкой правил.
    first_group = scores[:10]
    assert max(first_group) > min(first_group)


def test_train_ltr_rejects_empty_dataset(tmp_path):
    dataset = tmp_path / "empty.jsonl"
    dataset.write_text("", encoding="utf-8")
    result = subprocess.run(
        [sys.executable, str(TRAIN), str(dataset), "--output", str(tmp_path / "m.txt")],
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "Dataset is empty" in (result.stdout + result.stderr)


@pytest.mark.ml
def test_synthetic_or_unspecified_labels_cannot_be_production_approved(tmp_path):
    pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    dataset = _dataset(tmp_path, groups=2, per_group=5)
    result = subprocess.run(
        [
            sys.executable,
            str(TRAIN),
            str(dataset),
            "--production-approved",
            "--output",
            str(tmp_path / "model.txt"),
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "human_double_annotation_v1" in (result.stdout + result.stderr)


def test_train_ltr_metadata_identifies_model_and_data(tmp_path):
    pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    dataset = _dataset(tmp_path, groups=2, per_group=5)
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"

    result = subprocess.run(
        [sys.executable, str(TRAIN), str(dataset), "--output", str(model), "--metadata", str(metadata)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    meta = json.loads(metadata.read_text(encoding="utf-8"))
    import hashlib

    assert meta["datasetSha256"] == hashlib.sha256(dataset.read_bytes()).hexdigest()
    assert len(meta["datasetSha256"]) == 64
    assert len(meta["modelSha256"]) == 64
    assert len(meta["groupIdHashes"]) == 2
    assert all(len(value) == 64 for value in meta["groupIdHashes"])
    assert list(meta["featureStats"]) == FEATURE_ORDER
    assert set(meta["featureStats"][FEATURE_ORDER[0]]) == {"mean", "std", "min", "max"}
    assert meta["trainingParameters"]["random_state"] == 42
    assert meta["lightgbmVersion"]
    assert meta["productionApproved"] is False
    assert meta["labelMetadata"]["sources"] == {"unspecified": 10}


@pytest.mark.ml
def test_train_ltr_fits_loadable_isotonic_calibrator(tmp_path):
    pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    pytest.importorskip("sklearn", reason="scikit-learn ставится из requirements-ml.txt")
    train = _dataset(tmp_path, groups=6, name="train.jsonl")
    calibration = _dataset(
        tmp_path,
        groups=3,
        group_offset=20,
        name="calibration.jsonl",
    )
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"
    calibrator = tmp_path / "calibrator.json"

    result = subprocess.run(
        [
            sys.executable,
            str(TRAIN),
            str(train),
            "--calibration-dataset",
            str(calibration),
            "--output",
            str(model),
            "--metadata",
            str(metadata),
            "--calibrator",
            str(calibrator),
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    meta = json.loads(metadata.read_text(encoding="utf-8"))
    assert meta["calibration"]["method"] == "isotonic"
    assert len(meta["calibration"]["artifactSha256"]) == 64
    assert len(meta["calibration"]["groupIdHashes"]) == 3
    ranker = LTRRanker(model, metadata, calibrator, mode="ltr")
    assert ranker.status["modelLoaded"] is True
    assert ranker.status["calibratorLoaded"] is True
    assert ranker.model_version == "ltr-v1.2.0-calibrated"

    fail_closed = LTRRanker(model, metadata, tmp_path / "missing.json")
    assert fail_closed.status["modelLoaded"] is False
    assert "calibrator is missing" in str(fail_closed.status["warnings"][-1])


def test_offline_training_artifacts_are_ignored_by_git():
    gitignore = Path(__file__).resolve().parents[3] / ".gitignore"
    entries = set(gitignore.read_text(encoding="utf-8").split())
    assert "apps/ranking/model.txt" in entries
    assert "apps/ranking/model.meta.json" in entries
    assert "apps/ranking/calibrator.json" in entries


@pytest.mark.ml
def test_train_ltr_smoke_on_committed_gold(tmp_path):
    pytest.importorskip("lightgbm", reason="LightGBM ставится из requirements-ml.txt")
    dataset = Path(__file__).resolve().parents[1] / "evaluation/data/sanity_gold.jsonl"
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"

    result = subprocess.run(
        [sys.executable, str(TRAIN), str(dataset), "--output", str(model), "--metadata", str(metadata)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr

    meta = json.loads(metadata.read_text(encoding="utf-8"))
    assert meta["groups"] == 3
    assert meta["rows"] == 12
    assert meta["labels"] == [0, 1, 2, 3]
    assert meta["featureOrder"] == FEATURE_ORDER
    assert model.stat().st_size > 0
