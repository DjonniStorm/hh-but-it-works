import hashlib
import json
from pathlib import Path

from evaluation.features import FEATURE_ORDER, model_code_sha256


ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "evaluation/artifacts/ltr-v1.2.0"
LLM_BUNDLE = ROOT / "evaluation/artifacts/ltr-v1.3.0-llm"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_pretrained_bundle_is_complete_and_self_consistent():
    expected = {
        "model.txt",
        "model.meta.json",
        "calibrator.json",
        "promotion-report.json",
    }
    assert expected <= {path.name for path in BUNDLE.iterdir() if path.is_file()}
    assert all((BUNDLE / name).stat().st_size > 0 for name in expected)

    metadata = json.loads((BUNDLE / "model.meta.json").read_text(encoding="utf-8"))
    assert metadata["featureOrder"] == FEATURE_ORDER
    assert metadata["modelCodeSha256"] == model_code_sha256()
    assert metadata["modelSha256"] == sha256(BUNDLE / "model.txt")
    assert metadata["calibration"]["artifactSha256"] == sha256(
        BUNDLE / "calibrator.json"
    )
    assert metadata["productionApproved"] is False


def test_bundled_promotion_report_passes_committed_regression_gate():
    report = json.loads(
        (BUNDLE / "promotion-report.json").read_text(encoding="utf-8")
    )
    assert report["delta"]["ltr"]["ndcg@5"] >= 0.0
    assert report["delta"]["hybrid"]["ndcg@5"] >= 0.0
    assert (
        report["relevanceCalibration"]["ltr"]["rmse"]
        / report["relevanceCalibration"]["rules"]["rmse"]
        <= 0.5
    )


def test_llm_bundle_is_self_consistent_and_llm_approved():
    expected = {
        "model.txt",
        "model.meta.json",
        "calibrator.json",
        "promotion-report.json",
    }
    assert expected <= {path.name for path in LLM_BUNDLE.iterdir() if path.is_file()}
    assert all((LLM_BUNDLE / name).stat().st_size > 0 for name in expected)

    metadata = json.loads((LLM_BUNDLE / "model.meta.json").read_text(encoding="utf-8"))
    assert metadata["featureOrder"] == FEATURE_ORDER
    assert metadata["modelCodeSha256"] == model_code_sha256()
    assert metadata["modelSha256"] == sha256(LLM_BUNDLE / "model.txt")
    assert metadata["calibration"]["artifactSha256"] == sha256(
        LLM_BUNDLE / "calibrator.json"
    )
    assert metadata["productionApproved"] is True
    assert metadata["approvalSource"] == "llm_judge_v1"
    assert set(metadata["labelMetadata"]["sources"]) == {"llm_judge_v1"}

    report = json.loads((LLM_BUNDLE / "promotion-report.json").read_text(encoding="utf-8"))
    assert report["delta"]["ltr"]["ndcg@5"] >= 0.0
    assert report["delta"]["hybrid"]["ndcg@5"] >= 0.0
    assert (
        report["relevanceCalibration"]["ltr"]["rmse"]
        / report["relevanceCalibration"]["rules"]["rmse"]
        <= 0.5
    )


def test_runtime_dockerfile_never_trains_the_model():
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "train_ltr.py" not in dockerfile
    assert "requirements-train.txt" not in dockerfile
    assert "evaluation/artifacts/ltr-v1.2.0" in dockerfile
    assert "RANKING_ALLOW_UNAPPROVED_MODEL=true" in dockerfile
