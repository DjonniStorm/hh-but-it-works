# Pre-trained artifact bundles

`ltr-v1.2.0/` is the immutable default bundle consumed by `Dockerfile`.
It contains:

- `model.txt` — LightGBM model;
- `model.meta.json` — feature contract, code/data/model checksums and label provenance;
- `calibrator.json` — portable isotonic calibration without pickle;
- `promotion-report.json` — held-out rules/LTR/hybrid metrics.

`ltr-v1.3.0-llm/` is the first bundle approved through the explicit **llm
tier**: it was trained on `llm_gold_*` labels (`labelSource: llm_judge_v1`,
single-blind LLM judge) with `train_ltr.py --llm-approved`, so its metadata
carries `productionApproved: true` and `approvalSource: llm_judge_v1`. Runtime
activates it without `RANKING_ALLOW_UNAPPROVED_MODEL`. It is **not** a human
approval: the serving default stays `ltr-v1.2.0`, and the llm bundle must be
wired explicitly (`RANKING_MODEL_PATH` etc. or `RANKING_ARTIFACT_DIR`).
Known limitation: llm labels were shown to reproduce the synthetic scenario
ordering exactly (mean Kendall tau = 1.0 vs `gold.jsonl`), so this bundle
validates the activation path more than market uplift —
see `evaluation/data/llm_gold_provenance.json`.

The bundles contain no raw vacancies, resumes or candidate identifiers. Runtime
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
