import sys
from pathlib import Path
from typing import Optional

from evaluation.features import extract_features
from schemas import CandidateSnapshot, HiringNeedSnapshot, RankingContext, RankItem

MODEL_FILE = Path(__file__).resolve().parent / "model.txt"
CALIBRATOR_FILE = Path(__file__).resolve().parent / "calibrator.pkl"

# Optional dependencies for calibration
SKLEARN_AVAILABLE = False
try:
    import sklearn.calibration
    import sklearn.preprocessing
    SKLEARN_AVAILABLE = True
except ImportError:
    pass

class LTRRanker:
    """LightGBM LambdaRank model for candidate ranking.

    If a model file exists and can be loaded, it will be used to replace
    the rule-based scoring. Otherwise, the ranker falls back to None.
    """

    def __init__(self) -> None:
        self.model = None
        self.calibrator = None
        self._load_model()
        self._load_calibrator()

    def _load_model(self) -> None:
        if not MODEL_FILE.exists():
            return
        try:
            import lightgbm as lgb
        except ImportError:
            # LightGBM is an optional dependency (requirements-ml.txt).
            # If not installed, we cannot load the model.
            return

        try:
            self.model = lgb.Booster(model_file=str(MODEL_FILE))
        except Exception as exc:
            # Failed to load the model; treat as unavailable.
            print(
                f"WARNING: could not load LightGBM model from {MODEL_FILE}: {exc}",
                file=sys.stderr,
            )

    def _load_calibrator(self) -> None:
        if not CALIBRATOR_FILE.exists():
            return
        try:
            import joblib
        except ImportError:
            print(
                "WARNING: joblib not installed; cannot load calibrator",
                file=sys.stderr,
            )
            return
        try:
            self.calibrator = joblib.load(str(CALIBRATOR_FILE))
        except Exception as exc:
            print(
                f"WARNING: could not load calibrator from {CALIBRATOR_FILE}: {exc}",
                file=sys.stderr,
            )

    def _calibrate(self, predictions: list[float]) -> list[float]:
        """Apply calibration if available; otherwise return predictions unchanged."""
        if self.calibrator is None:
            return predictions
        if not SKLEARN_AVAILABLE:
            print(
                "WARNING: scikit-learn not installed; calibration skipped",
                file=sys.stderr,
            )
            return predictions
        try:
            # Reshape predictions for sklearn (n_samples, n_features)
            X = [[p] for p in predictions]
            calibrated = self.calibrator.predict_proba(X)
            # calibrated shape: (n_samples, n_classes), assuming binary classification
            # return the probability of class 1 (positive)
            return [p[1] for p in calibrated]
        except Exception as exc:
            print(
                f"WARNING: calibration failed: {exc}",
                file=sys.stderr,
            )
            return predictions

    def rank(
        self,
        candidates: list[CandidateSnapshot],
        need: HiringNeedSnapshot,
        context: Optional[RankingContext] = None,
    ) -> list[RankItem]:
        """Score candidates using the LTR model if available, otherwise fallback."""
        if self.model is None:
            # Fallback to rule-based ranking.
            from scoring import rank_candidates

            return rank_candidates(candidates, need, context or RankingContext())

        # Extract features for each candidate.
        feature_vectors = [extract_features(c, need) for c in candidates]
        # Predict relevance scores.
        predictions = self.model.predict(feature_vectors)

        # Apply calibration if available.
        calibrated = self._calibrate(list(predictions))

        # Normalize predictions to [0, 1] (model may output values outside).
        # In LambdaRank, predictions are typically relevance scores.
        # We'll map them to [0,1] using min-max scaling based on observed min/max.
        if calibrated:
            pred_min = min(calibrated)
            pred_max = max(calibrated)
            if pred_max - pred_min > 0:
                normalized = [(p - pred_min) / (pred_max - pred_min) for p in calibrated]
            else:
                normalized = [0.0] * len(calibrated)
        else:
            normalized = []

        # Build RankItem for each candidate.
        # Use rule‑based ranking to get eligibility, components, reasons, warnings, rejectedBy.
        from scoring import rank_candidates

        results = rank_candidates(candidates, need, context or RankingContext())

        # Replace matchScore with calibrated predictions for eligible candidates.
        for idx, item in enumerate(results):
            if item.eligible and idx < len(normalized):
                # Round to 6 decimal places as per RankItem definition.
                item.matchScore = round(float(normalized[idx]), 6)
            else:
                item.matchScore = 0.0

        return results

    @property
    def model_version(self) -> str:
        if self.model is not None:
            if self.calibrator is not None:
                return "ltr-v1-calibrated"
            return "ltr-v1"
        return "rules-v1.0.0"

