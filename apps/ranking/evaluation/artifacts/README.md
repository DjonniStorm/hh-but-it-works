# Pre-trained artifact bundles

`ltr-v1.5.0-llm/` is the immutable **serving default** consumed by
`Dockerfile` (`RANKING_ARTIFACT_DIR`). It contains:

- `model.txt` — LightGBM model;
- `model.meta.json` — feature contract, code/data/model checksums and label provenance;
- `calibrator.json` — portable isotonic calibration without pickle;
- `promotion-report.json` — held-out rules/LTR/hybrid metrics.

It is trained on `llm_gold_*` labels (`labelSource: llm_judge_v1`, single-blind
LLM judge) with `train_ltr.py --llm-approved`, so its metadata carries
`productionApproved: true` and `approvalSource: llm_judge_v1` — since 2026-10-10
the runtime activates it without `RANKING_ALLOW_UNAPPROVED_MODEL`. It is
**not** a human approval — the human tier (`--production-approved`) is
unlocked only by double human annotation. Known limitation: llm labels were
shown to reproduce the synthetic scenario ordering exactly (mean Kendall
tau = 1.0 vs `gold.jsonl`), so this bundle validates the activation path more
than market uplift — see `evaluation/data/llm_gold_provenance.json`.
v1.5.0 differs from v1.4.0-llm because the rules scoring formula changed
(mandatory-skill presence penalty and updated weights); it was retrained after
that formula change and carries the matching feature-code SHA.

Legacy bundles, retained as history only:

- `ltr-v1.1.0/` — trained under `rules-v1.1.0`;
- `ltr-v1.2.0/` — trained under pre-embedding feature code, `productionApproved: false`;
- `ltr-v1.3.0-llm/` — first llm-approved bundle, also pre-embedding.

Runtime fails them closed to rules (`different feature code` SHA mismatch),
so `scripts/check_ml.sh` verifies only `ltr-v1.5.0-llm`; their committed
`promotion-report.json` gates remain asserted in
`tests/test_pretrained_distribution.py`. Never overwrite a released directory.

The local embedding model used by the `semantic` feature lives next to the
bundles under `evaluation/models/`. GitHub rejects files over 100 MB and the
int8 ONNX is 112.7 MiB, so git stores it as equal parts
`embedder-int8.onnx.NNNN` (≤90 MiB each) plus `tokenizer.json` and
`embedder.meta.json` (pinned source revision, SHA-256 of every part and of
the assembled file). The assembled `embedder-int8.onnx` is gitignored and
rebuilt from verified parts on first load. Rebuild with dev-only
`scripts/build_embedder.py` (`requirements-embedder.txt`).

The bundles contain no raw vacancies, resumes or candidate identifiers. Runtime
validates its SHA-256 and feature-code fingerprint before loading it.

Maintainers rebuild a new version explicitly (llm tier shown; the gold-tier
equivalent is `scripts/promote_ml.sh` on `gold_*` splits):

```bash
python -m venv /tmp/ranking-train
. /tmp/ranking-train/bin/activate
pip install -r requirements-train.txt
python evaluation/train_ltr.py evaluation/data/llm_gold_train.jsonl \
  --calibration-dataset evaluation/data/llm_gold_calibration.jsonl \
  --model-version ltr-v1.5.0-llm --llm-approved \
  --output evaluation/artifacts/ltr-v1.5.0-llm/model.txt \
  --metadata evaluation/artifacts/ltr-v1.5.0-llm/model.meta.json \
  --calibrator evaluation/artifacts/ltr-v1.5.0-llm/calibrator.json
python evaluation/evaluate_ltr.py evaluation/data/llm_gold_test.jsonl \
  --model evaluation/artifacts/ltr-v1.5.0-llm/model.txt \
  --metadata evaluation/artifacts/ltr-v1.5.0-llm/model.meta.json \
  --calibrator evaluation/artifacts/ltr-v1.5.0-llm/calibrator.json \
  --min-ndcg-uplift 0.0 --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5 \
  > evaluation/artifacts/ltr-v1.5.0-llm/promotion-report.json
```

After training a new version, run `scripts/check_ml.sh`, then update
`RANKING_ARTIFACT_DIR` in the Docker build.
