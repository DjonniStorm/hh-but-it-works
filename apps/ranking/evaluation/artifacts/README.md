# Pre-trained artifact bundles

`ltr-v1.2.0/` is the immutable default bundle consumed by `Dockerfile`.
It contains:

- `model.txt` — LightGBM model;
- `model.meta.json` — feature contract, code/data/model checksums and label provenance;
- `calibrator.json` — portable isotonic calibration without pickle;
- `promotion-report.json` — held-out rules/LTR/hybrid metrics.

The bundle contains no raw vacancies, resumes or candidate identifiers. Runtime
validates its SHA-256 and feature-code fingerprint before loading it.

Maintainers rebuild a new version explicitly:

```bash
python -m venv /tmp/ranking-train
. /tmp/ranking-train/bin/activate
pip install -r requirements-train.txt
sh scripts/promote_ml.sh evaluation/artifacts/ltr-v1.2.0
```

Never overwrite a released directory. Create a new version, run
`scripts/check_ml.sh`, then update `RANKING_ARTIFACT_DIR` in the Docker build.
