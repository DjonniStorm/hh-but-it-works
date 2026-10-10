#!/usr/bin/env sh
set -eu

ranking_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
artifact_dir="${1:-$ranking_dir/evaluation/artifacts/ltr-v1.5.0-llm}"
dataset="${2:-evaluation/data/llm_gold_test.jsonl}"

cd "$ranking_dir"
for artifact in model.txt model.meta.json calibrator.json promotion-report.json; do
  test -s "$artifact_dir/$artifact" || {
    printf 'missing or empty artifact: %s\n' "$artifact_dir/$artifact" >&2
    exit 1
  }
done

python evaluation/evaluate_ltr.py "$dataset" \
  --model "$artifact_dir/model.txt" \
  --metadata "$artifact_dir/model.meta.json" \
  --calibrator "$artifact_dir/calibrator.json" \
  --min-ndcg-uplift 0.0 \
  --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5 \
  >/dev/null

python - "$artifact_dir" <<'PY'
import json
import os
import sys
from pathlib import Path

from ltr import LTRRanker

artifact_dir = Path(sys.argv[1])
metadata = json.loads((artifact_dir / "model.meta.json").read_text(encoding="utf-8"))
approved = metadata.get("productionApproved") is True
os.environ["RANKING_MODEL_PATH"] = str(artifact_dir / "model.txt")
os.environ["RANKING_MODEL_METADATA_PATH"] = str(artifact_dir / "model.meta.json")
os.environ["RANKING_CALIBRATOR_PATH"] = str(artifact_dir / "calibrator.json")
os.environ["RANKING_MODE"] = "hybrid"
if not approved:
    os.environ["RANKING_ALLOW_UNAPPROVED_MODEL"] = "true"

ranker = LTRRanker()
status = ranker.status
assert status["modelLoaded"] is True, status
assert status["calibratorLoaded"] is True, status
assert status["mode"] == "hybrid", status
assert status["productionApproved"] is approved, status
if approved:
    assert status["unapprovedOverride"] is False, status
    assert ranker.production_approved is True, status
else:
    assert status["unapprovedOverride"] is True, status
print(f"verified {status['artifactVersion']} (mode={status['mode']}, approved={approved})")
PY
