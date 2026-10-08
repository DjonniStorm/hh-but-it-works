from __future__ import annotations

import json
import math
from bisect import bisect_right
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


@dataclass(frozen=True)
class IsotonicCalibrator:
    """Portable inference-only representation of sklearn isotonic regression."""

    x_thresholds: tuple[float, ...]
    y_thresholds: tuple[float, ...]

    @classmethod
    def from_file(cls, path: Path) -> "IsotonicCalibrator":
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("schemaVersion") != 1:
            raise ValueError("unsupported calibration schema version")
        if payload.get("method") != "isotonic":
            raise ValueError("unsupported calibration method")
        x_values = tuple(float(value) for value in payload["xThresholds"])
        y_values = tuple(float(value) for value in payload["yThresholds"])
        calibrator = cls(x_thresholds=x_values, y_thresholds=y_values)
        calibrator._validate()
        return calibrator

    def _validate(self) -> None:
        if len(self.x_thresholds) < 2 or len(self.x_thresholds) != len(
            self.y_thresholds
        ):
            raise ValueError("calibration thresholds must have equal length >= 2")
        if not all(math.isfinite(value) for value in (*self.x_thresholds, *self.y_thresholds)):
            raise ValueError("calibration thresholds must be finite")
        if any(
            left >= right
            for left, right in zip(self.x_thresholds, self.x_thresholds[1:])
        ):
            raise ValueError("x thresholds must be strictly increasing")
        if any(
            left > right
            for left, right in zip(self.y_thresholds, self.y_thresholds[1:])
        ):
            raise ValueError("y thresholds must be non-decreasing")
        if not all(0.0 <= value <= 1.0 for value in self.y_thresholds):
            raise ValueError("y thresholds must be in [0, 1]")

    def predict(self, values: Sequence[float]) -> list[float]:
        return [self._interpolate(float(value)) for value in values]

    def _interpolate(self, value: float) -> float:
        if not math.isfinite(value):
            return value
        if value <= self.x_thresholds[0]:
            return self.y_thresholds[0]
        if value >= self.x_thresholds[-1]:
            return self.y_thresholds[-1]

        right = bisect_right(self.x_thresholds, value)
        left = right - 1
        x0, x1 = self.x_thresholds[left], self.x_thresholds[right]
        y0, y1 = self.y_thresholds[left], self.y_thresholds[right]
        ratio = (value - x0) / (x1 - x0)
        return y0 + ratio * (y1 - y0)
