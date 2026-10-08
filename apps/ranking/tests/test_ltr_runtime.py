import hashlib
import json
from pathlib import Path

import pytest

from evaluation.features import FEATURE_ORDER, model_code_sha256
from factories import backend_need, candidate
from ltr import LTRRanker
from scoring import rank_candidates


class FakeModel:
    def __init__(self, values):
        self.values = values

    def predict(self, features):
        assert len(features) == len(self.values)
        return self.values


class FailingModel:
    def predict(self, features):
        raise RuntimeError("broken artifact")


class FakeCalibrator:
    def predict(self, values):
        return [0.2 if value < 0 else 0.9 for value in values]


class WrongLengthCalibrator:
    def predict(self, values):
        return []


def ranker_with(model, calibrator=None, mode="ltr", blend_weight=0.25) -> LTRRanker:
    missing = Path(__file__).with_name("missing-artifact")
    ranker = LTRRanker(
        missing,
        missing,
        missing,
        mode=mode,
        blend_weight=blend_weight,
    )
    ranker.model = model
    ranker.calibrator = calibrator
    ranker.metadata = {"modelVersion": "ltr-test", "featureOrder": []}
    return ranker


def test_ltr_predictions_stay_attached_to_input_candidates_and_resort():
    low = candidate(id="low")
    high = candidate(id="high")
    ranker = ranker_with(FakeModel([-2.0, 2.0]))

    result = ranker.rank([low, high], backend_need())

    assert [item.candidateId for item in result] == ["high", "low"]
    assert result[0].matchScore > result[1].matchScore
    assert {item.modelVersion for item in result} == {"ltr-test"}


def test_single_candidate_gets_a_meaningful_score_instead_of_minmax_zero():
    ranker = ranker_with(FakeModel([0.0]))

    result = ranker.rank([candidate()], backend_need())

    assert result[0].matchScore == 0.5


def test_isotonic_calibrator_predict_is_used():
    ranker = ranker_with(FakeModel([-1.0, 1.0]), FakeCalibrator())

    result = ranker.rank(
        [candidate(id="low"), candidate(id="high")],
        backend_need(),
    )

    assert [(item.candidateId, item.matchScore) for item in result] == [
        ("high", 0.9),
        ("low", 0.2),
    ]
    assert ranker.model_version == "ltr-test-calibrated"


def test_hard_rejected_candidate_keeps_zero_score():
    ranker = ranker_with(FakeModel([20.0]))

    result = ranker.rank(
        [candidate(id="hidden", availability="hidden")],
        backend_need(),
    )

    assert result[0].eligible is False
    assert result[0].matchScore == 0.0


def test_hybrid_blends_rules_and_ltr_without_losing_explanations():
    item = candidate()
    need = backend_need()
    rules = rank_candidates([item], need)[0]
    ranker = ranker_with(FakeModel([0.0]), mode="hybrid", blend_weight=0.25)

    run = ranker.rank_run([item], need)

    expected = round(0.75 * rules.matchScore + 0.25 * 0.5, 6)
    assert run.items[0].matchScore == expected
    assert run.items[0].reasons == rules.reasons
    assert run.mode == "hybrid"
    assert run.model_version == "hybrid-v1.1.0-ltr0.25"
    assert set(run.diagnostics) == {
        "rankingAgreement",
        "topKOverlap",
        "meanAbsoluteScoreDelta",
    }


def test_shadow_computes_diagnostics_but_serves_rules_unchanged():
    candidates = [candidate(id="a"), candidate(id="b")]
    need = backend_need()
    expected = rank_candidates(candidates, need)
    ranker = ranker_with(FakeModel([-2.0, 2.0]), mode="shadow")

    run = ranker.rank_run(candidates, need)

    assert [item.model_dump() for item in run.items] == [
        item.model_dump() for item in expected
    ]
    assert run.mode == "shadow"
    assert run.model_version.startswith("rules-v1")
    assert run.diagnostics["rankingAgreement"] == 0.0


def test_runtime_reports_feature_drift_against_training_statistics():
    ranker = ranker_with(FakeModel([0.0]), mode="shadow")
    ranker.metadata["featureStats"] = {
        name: {"mean": 0.0, "std": 0.1, "min": 0.0, "max": 1.0}
        for name in FEATURE_ORDER
    }

    run = ranker.rank_run([candidate()], backend_need())

    assert run.diagnostics["featureDriftMaxZ"] > 3.0
    assert 0.0 <= run.diagnostics["featureDriftShareAbove3"] <= 1.0


def test_prediction_error_falls_back_to_rules():
    ranker = ranker_with(FailingModel())

    run = ranker.rank_run([candidate()], backend_need())

    assert run.mode == "rules_error_fallback"
    assert run.model_version.startswith("rules-v1")
    assert run.items[0].matchScore > 0


def test_empty_ltr_request_does_not_call_the_model():
    ranker = ranker_with(FailingModel())

    run = ranker.rank_run([], backend_need())

    assert run.items == []
    assert run.mode == "ltr"


def test_invalid_calibrator_output_is_rejected():
    ranker = ranker_with(FakeModel([0.0]), WrongLengthCalibrator())
    with pytest.raises(ValueError, match="different number"):
        ranker._scores([0.0])
    ranker.calibrator = None
    with pytest.raises(ValueError, match="non-finite"):
        ranker._scores([float("nan")])


def test_stale_feature_metadata_prevents_artifact_activation(tmp_path):
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"
    model.write_text("not read because metadata is stale", encoding="utf-8")
    metadata.write_text(
        json.dumps({"artifactSchemaVersion": 1, "featureOrder": ["obsolete"]}),
        encoding="utf-8",
    )

    ranker = LTRRanker(model, metadata, tmp_path / "calibrator.json", mode="ltr")

    assert ranker.model is None
    assert ranker.status["mode"] == "rules"
    assert "feature order" in str(ranker.status["warnings"][0])


def test_corrupt_or_incomplete_artifacts_fail_closed(tmp_path):
    model = tmp_path / "model.txt"
    metadata = tmp_path / "model.meta.json"
    model.write_text("not-a-lightgbm-model", encoding="utf-8")

    missing_metadata = LTRRanker(model, metadata, tmp_path / "calibrator.json")
    assert "metadata is missing" in str(missing_metadata.status["warnings"][0])

    metadata.write_text("{", encoding="utf-8")
    corrupt_metadata = LTRRanker(model, metadata, tmp_path / "calibrator.json")
    assert "could not be read" in str(corrupt_metadata.status["warnings"][0])

    metadata.write_text(
        json.dumps(
            {
                "artifactSchemaVersion": 1,
                "featureOrder": FEATURE_ORDER,
                "modelCodeSha256": model_code_sha256(),
                "modelSha256": "wrong",
            }
        ),
        encoding="utf-8",
    )
    wrong_checksum = LTRRanker(model, metadata, tmp_path / "calibrator.json")
    assert "checksum does not match" in str(wrong_checksum.status["warnings"][0])

    metadata.write_text(
        json.dumps(
            {
                "featureOrder": FEATURE_ORDER,
                "artifactSchemaVersion": 1,
                "modelCodeSha256": model_code_sha256(),
                "modelSha256": hashlib.sha256(model.read_bytes()).hexdigest(),
            }
        ),
        encoding="utf-8",
    )
    corrupt_model = LTRRanker(model, metadata, tmp_path / "calibrator.json")
    assert "model could not be loaded" in str(corrupt_model.status["warnings"][0])


def test_invalid_rollout_configuration_falls_back_safely(monkeypatch, tmp_path):
    monkeypatch.setenv("RANKING_MODE", "surprise")
    monkeypatch.setenv("RANKING_LTR_WEIGHT", "not-a-number")

    ranker = LTRRanker(
        tmp_path / "missing-model.txt",
        tmp_path / "missing-metadata.json",
        tmp_path / "missing-calibrator.json",
    )

    assert ranker.requested_mode == "rules"
    assert ranker.blend_weight == 0.25
    assert len(ranker.load_warnings) == 2


def test_unapproved_runtime_artifact_is_forced_to_shadow(monkeypatch, tmp_path):
    monkeypatch.setenv("RANKING_MODE", "hybrid")
    missing = tmp_path / "missing"
    ranker = LTRRanker(missing, missing, missing)
    ranker.model = FakeModel([2.0])
    ranker.metadata = {"modelVersion": "synthetic", "productionApproved": False}

    run = ranker.rank_run([candidate()], backend_need())

    assert ranker.active_mode == "shadow"
    assert ranker.status["readyForRequestedMode"] is False
    assert run.mode == "shadow"
    assert run.model_version.startswith("rules-v1")
