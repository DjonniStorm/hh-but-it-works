from __future__ import annotations

import hashlib
import json
import logging
import math
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence

from calibration import IsotonicCalibrator
from embedding_similarity import embedding_available
from evaluation.features import FEATURE_ORDER, extract_features, model_code_sha256
from schemas import CandidateSnapshot, HiringNeedSnapshot, RankingContext, RankItem
from scoring import MODEL_VERSION as RULES_MODEL_VERSION
from scoring import rank_candidates, score_pair


ROOT = Path(__file__).resolve().parent
MODEL_FILE = ROOT / "model.txt"
METADATA_FILE = ROOT / "model.meta.json"
CALIBRATOR_FILE = ROOT / "calibrator.json"
LOGGER = logging.getLogger("ranking.ltr")


@dataclass(frozen=True)
class RankingRun:
    items: list[RankItem]
    model_version: str
    mode: str
    diagnostics: dict[str, float] = field(default_factory=dict)


def _artifact_path(env_name: str, default: Path) -> Path:
    configured = os.getenv(env_name)
    return Path(configured).expanduser() if configured else default


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class LTRRanker:
    """Optional LightGBM ranker with a safe deterministic rules fallback.

    Loading the model is fail-closed: an artifact is activated only when its
    metadata exists and declares the exact feature order used by this code.
    LightGBM and scikit-learn remain optional production dependencies.
    """

    def __init__(
        self,
        model_path: Path | None = None,
        metadata_path: Path | None = None,
        calibrator_path: Path | None = None,
        mode: str | None = None,
        blend_weight: float | None = None,
    ) -> None:
        self.model_path = model_path or _artifact_path("RANKING_MODEL_PATH", MODEL_FILE)
        self.metadata_path = metadata_path or _artifact_path(
            "RANKING_MODEL_METADATA_PATH",
            METADATA_FILE,
        )
        self.calibrator_path = calibrator_path or _artifact_path(
            "RANKING_CALIBRATOR_PATH",
            CALIBRATOR_FILE,
        )
        self.model: Any | None = None
        self.calibrator: Any | None = None
        self.metadata: dict[str, Any] = {}
        self.load_warnings: list[str] = []
        # Passing a mode directly is an explicit offline evaluation/test action.
        # Runtime configuration alone cannot activate a synthetic artifact.
        self.allow_unapproved = mode is not None or os.getenv(
            "RANKING_ALLOW_UNAPPROVED_MODEL", ""
        ).strip().lower() in {"1", "true", "yes"}
        self.requested_mode = (mode or os.getenv("RANKING_MODE", "hybrid")).lower()
        raw_weight: object = (
            blend_weight
            if blend_weight is not None
            else os.getenv("RANKING_LTR_WEIGHT", "0.25")
        )
        try:
            configured_weight = float(raw_weight)
        except (TypeError, ValueError):
            self._warn(f"Invalid RANKING_LTR_WEIGHT={raw_weight!r}; using 0.25")
            configured_weight = 0.25
        if not math.isfinite(configured_weight):
            self._warn(f"Non-finite RANKING_LTR_WEIGHT={raw_weight!r}; using 0.25")
            configured_weight = 0.25
        self.blend_weight = max(0.0, min(1.0, configured_weight))
        if self.blend_weight != configured_weight:
            self._warn("RANKING_LTR_WEIGHT was clamped to [0, 1]")
        if self.requested_mode not in {"rules", "shadow", "hybrid", "ltr"}:
            self._warn(
                f"Unknown RANKING_MODE={self.requested_mode!r}; using rules mode"
            )
            self.requested_mode = "rules"
        self._load_artifacts()
        if (
            self.model is not None
            and self.requested_mode in {"hybrid", "ltr"}
            and not self.production_approved
            and not self.allow_unapproved
        ):
            self._warn(
                "LTR artifact is not production-approved; running in shadow mode"
            )

    def _warn(self, message: str) -> None:
        self.load_warnings.append(message)
        LOGGER.warning(message)

    def _load_artifacts(self) -> None:
        if not self.model_path.exists():
            return

        if not self.metadata_path.exists():
            self._warn(f"LTR metadata is missing: {self.metadata_path}")
            return

        try:
            metadata = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            self._warn(f"LTR metadata could not be read: {exc}")
            return

        if metadata.get("artifactSchemaVersion") != 1:
            self._warn("LTR artifact schema version is unsupported")
            return
        if metadata.get("featureOrder") != FEATURE_ORDER:
            self._warn("LTR artifact feature order does not match the running code")
            return
        if metadata.get("modelCodeSha256") != model_code_sha256():
            self._warn("LTR artifact was trained with different feature code")
            return
        try:
            model_sha256 = _sha256(self.model_path)
        except OSError as exc:
            self._warn(f"LTR model checksum could not be read: {exc}")
            return
        if metadata.get("modelSha256") != model_sha256:
            self._warn("LTR model checksum does not match its metadata")
            return
        self.metadata = metadata

        try:
            import lightgbm as lgb
        except ImportError:
            self._warn("LightGBM is not installed; using rules fallback")
            return

        try:
            self.model = lgb.Booster(model_file=str(self.model_path))
        except Exception as exc:  # LightGBM exposes several loader exceptions.
            self._warn(f"LTR model could not be loaded: {exc}")
            return

        calibration_metadata = metadata.get("calibration")
        if not calibration_metadata:
            return

        if not isinstance(calibration_metadata, dict):
            self._warn("LTR calibration metadata is malformed")
            self.model = None
            return
        if not self.calibrator_path.exists():
            self._warn(f"LTR calibrator is missing: {self.calibrator_path}")
            self.model = None
            return
        try:
            calibrator_sha256 = _sha256(self.calibrator_path)
        except OSError as exc:
            self._warn(f"LTR calibrator checksum could not be read: {exc}")
            self.model = None
            return
        if calibration_metadata.get("artifactSha256") != calibrator_sha256:
            self._warn("LTR calibrator checksum does not match its metadata")
            self.model = None
            return

        try:
            self.calibrator = IsotonicCalibrator.from_file(self.calibrator_path)
        except Exception as exc:  # JSON/schema/IO failures all disable the artifact.
            self._warn(f"LTR calibrator could not be loaded: {exc}")
            self.model = None

    @property
    def artifact_version(self) -> str:
        if self.model is None:
            return RULES_MODEL_VERSION
        version = str(self.metadata.get("modelVersion", "ltr-v1.2.0"))
        return f"{version}-calibrated" if self.calibrator is not None else version

    @property
    def model_version(self) -> str:
        if self.model is None or self.active_mode in {"rules", "shadow"}:
            return RULES_MODEL_VERSION
        if self.active_mode == "hybrid":
            rules_series = RULES_MODEL_VERSION.removeprefix("rules-")
            return f"hybrid-{rules_series}-ltr{self.blend_weight:.2f}"
        return self.artifact_version

    @property
    def production_approved(self) -> bool:
        return self.metadata.get("productionApproved") is True

    @property
    def active_mode(self) -> str:
        if self.model is None:
            return "rules"
        if (
            self.requested_mode in {"hybrid", "ltr"}
            and not self.production_approved
            and not self.allow_unapproved
        ):
            return "shadow"
        return self.requested_mode

    @property
    def status(self) -> dict[str, object]:
        return {
            "mode": self.active_mode,
            "requestedMode": self.requested_mode,
            "modelLoaded": self.model is not None,
            "calibratorLoaded": self.calibrator is not None,
            "artifactVersion": self.artifact_version,
            "productionApproved": self.production_approved,
            "unapprovedOverride": self.allow_unapproved,
            "embeddingReady": embedding_available(),
            "blendWeight": self.blend_weight,
            "readyForRequestedMode": (
                self.active_mode == self.requested_mode
            ),
            "warnings": list(self.load_warnings),
        }

    @staticmethod
    def _sigmoid(value: float) -> float:
        if value >= 0:
            return 1.0 / (1.0 + math.exp(-value))
        exp_value = math.exp(value)
        return exp_value / (1.0 + exp_value)

    def _scores(self, raw_predictions: Sequence[float]) -> list[float]:
        raw = [float(value) for value in raw_predictions]
        if self.calibrator is None:
            values = [self._sigmoid(value) for value in raw]
        else:
            # IsotonicRegression consumes a one-dimensional score vector.
            values = [float(value) for value in self.calibrator.predict(raw)]

        if len(values) != len(raw):
            raise ValueError("calibrator returned a different number of scores")
        if not all(math.isfinite(value) for value in values):
            raise ValueError("model returned a non-finite score")
        return [max(0.0, min(1.0, value)) for value in values]

    @staticmethod
    def _sort(items: list[RankItem]) -> list[RankItem]:
        return sorted(
            items,
            key=lambda item: (
                -int(item.eligible),
                -item.matchScore,
                -item.qualificationScore,
                item.candidateId,
            ),
        )

    @staticmethod
    def _diagnostics(
        baseline: list[RankItem],
        ltr_scores: list[float],
    ) -> dict[str, float]:
        eligible = [
            (index, item.candidateId, item.matchScore, ltr_score)
            for index, (item, ltr_score) in enumerate(zip(baseline, ltr_scores))
            if item.eligible
        ]
        if not eligible:
            return {
                "rankingAgreement": 1.0,
                "topKOverlap": 1.0,
                "meanAbsoluteScoreDelta": 0.0,
            }

        agreements = 0.0
        pairs = 0
        for index, (_, _, left_rule, left_ltr) in enumerate(eligible):
            for _, _, right_rule, right_ltr in eligible[index + 1 :]:
                rule_order = (left_rule > right_rule) - (left_rule < right_rule)
                ltr_order = (left_ltr > right_ltr) - (left_ltr < right_ltr)
                agreements += 1.0 if rule_order == ltr_order else 0.0
                pairs += 1

        rule_ordered = [
            row_index
            for row_index, candidate_id, _, _ in sorted(
                eligible,
                key=lambda row: (-row[2], row[1], row[0]),
            )
        ]
        ltr_ordered = [
            row_index
            for row_index, candidate_id, _, _ in sorted(
                eligible,
                key=lambda row: (-row[3], row[1], row[0]),
            )
        ]
        top_k = min(5, len(eligible))
        return {
            "rankingAgreement": agreements / pairs if pairs else 1.0,
            "topKOverlap": len(
                set(rule_ordered[:top_k]) & set(ltr_ordered[:top_k])
            )
            / top_k,
            "meanAbsoluteScoreDelta": sum(
                abs(rule_score - ltr_score)
                for _, _, rule_score, ltr_score in eligible
            )
            / len(eligible),
        }

    def _feature_drift(
        self,
        feature_vectors: list[list[float]],
    ) -> dict[str, float]:
        stored = self.metadata.get("featureStats")
        if not isinstance(stored, dict) or not feature_vectors:
            return {}

        z_scores: list[float] = []
        for row in feature_vectors:
            for name, value in zip(FEATURE_ORDER, row):
                stats = stored.get(name)
                if not isinstance(stats, dict):
                    continue
                mean = float(stats.get("mean", 0.0))
                std = float(stats.get("std", 0.0))
                if std > 1e-9:
                    z_scores.append(abs(value - mean) / std)
                elif abs(value - mean) > 1e-9:
                    z_scores.append(10.0)
        if not z_scores:
            return {}
        return {
            "featureDriftMaxZ": max(z_scores),
            "featureDriftShareAbove3": sum(
                1 for value in z_scores if value > 3.0
            )
            / len(z_scores),
        }

    def rank_run(
        self,
        candidates: list[CandidateSnapshot],
        need: HiringNeedSnapshot,
        context: RankingContext | None = None,
    ) -> RankingRun:
        ranking_context = context or RankingContext()
        mode = self.active_mode
        if self.model is None or mode == "rules":
            return RankingRun(
                items=rank_candidates(candidates, need, ranking_context),
                model_version=RULES_MODEL_VERSION,
                mode="rules" if self.model is not None else "rules_missing_artifact",
            )

        if not candidates:
            return RankingRun(
                items=[],
                model_version=self.model_version,
                mode=mode,
            )

        baseline = [score_pair(candidate, need, ranking_context) for candidate in candidates]
        features = [
            extract_features(candidate, need, ranking_context)
            for candidate in candidates
        ]
        try:
            raw_predictions = self.model.predict(features)
            if len(raw_predictions) != len(candidates):
                raise ValueError("model returned a different number of predictions")
            scores = self._scores(raw_predictions)
        except Exception as exc:  # Prediction must never take the endpoint down.
            LOGGER.exception("LTR prediction failed; using rules fallback: %s", exc)
            return RankingRun(
                items=rank_candidates(candidates, need, ranking_context),
                model_version=RULES_MODEL_VERSION,
                mode="rules_error_fallback",
            )

        diagnostics = {
            **self._diagnostics(baseline, scores),
            **self._feature_drift(features),
        }
        if mode == "shadow":
            return RankingRun(
                items=rank_candidates(candidates, need, ranking_context),
                model_version=RULES_MODEL_VERSION,
                mode="shadow",
                diagnostics=diagnostics,
            )

        for item, ltr_score in zip(baseline, scores):
            if not item.eligible:
                item.matchScore = 0.0
            elif mode == "hybrid":
                item.matchScore = round(
                    (1.0 - self.blend_weight) * item.matchScore
                    + self.blend_weight * ltr_score,
                    6,
                )
            else:
                item.matchScore = round(ltr_score, 6)
            item.modelVersion = self.model_version

        return RankingRun(
            items=self._sort(baseline),
            model_version=self.model_version,
            mode=mode,
            diagnostics=diagnostics,
        )

    def rank(
        self,
        candidates: list[CandidateSnapshot],
        need: HiringNeedSnapshot,
        context: RankingContext | None = None,
    ) -> list[RankItem]:
        return self.rank_run(candidates, need, context).items
