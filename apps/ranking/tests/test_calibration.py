import json

import pytest

from calibration import IsotonicCalibrator


def test_portable_isotonic_calibrator_interpolates_and_clips(tmp_path):
    path = tmp_path / "calibrator.json"
    path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "method": "isotonic",
                "xThresholds": [-1.0, 0.0, 2.0],
                "yThresholds": [0.1, 0.4, 1.0],
            }
        ),
        encoding="utf-8",
    )

    calibrator = IsotonicCalibrator.from_file(path)

    assert calibrator.predict([-2.0, -0.5, 1.0, 3.0]) == pytest.approx(
        [0.1, 0.25, 0.7, 1.0]
    )


@pytest.mark.parametrize(
    "x_values, y_values, message",
    [
        ([0.0], [0.5], "equal length"),
        ([0.0, 0.0], [0.2, 0.8], "strictly increasing"),
        ([0.0, 1.0], [0.8, 0.2], "non-decreasing"),
        ([0.0, 1.0], [0.2, 1.2], r"\[0, 1\]"),
    ],
)
def test_portable_isotonic_calibrator_rejects_invalid_thresholds(
    tmp_path,
    x_values,
    y_values,
    message,
):
    path = tmp_path / "calibrator.json"
    path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "method": "isotonic",
                "xThresholds": x_values,
                "yThresholds": y_values,
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match=message):
        IsotonicCalibrator.from_file(path)


@pytest.mark.ml
def test_portable_calibrator_matches_sklearn_isotonic(tmp_path):
    sklearn = pytest.importorskip("sklearn", reason="requirements-ml.txt")
    from sklearn.isotonic import IsotonicRegression

    fitted = IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip").fit(
        [-3.0, -1.0, 0.0, 2.0, 4.0],
        [0.0, 0.2, 0.2, 0.9, 1.0],
    )
    path = tmp_path / "calibrator.json"
    path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "method": "isotonic",
                "xThresholds": fitted.X_thresholds_.tolist(),
                "yThresholds": fitted.y_thresholds_.tolist(),
            }
        ),
        encoding="utf-8",
    )
    portable = IsotonicCalibrator.from_file(path)
    samples = [-5.0, -2.0, -0.5, 1.0, 3.0, 6.0]

    assert portable.predict(samples) == pytest.approx(fitted.predict(samples))
    assert sklearn.__version__
