#!/usr/bin/env sh
set -eu

ranking_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
artifact_dir="${1:-$ranking_dir/evaluation/artifacts/ltr-v1.2.0}"

cd "$ranking_dir"
for artifact in model.txt model.meta.json calibrator.json promotion-report.json; do
  test -s "$artifact_dir/$artifact" || {
    printf 'missing or empty artifact: %s\n' "$artifact_dir/$artifact" >&2
    exit 1
  }
done

python evaluation/evaluate_ltr.py evaluation/data/gold_test.jsonl \
  --model "$artifact_dir/model.txt" \
  --metadata "$artifact_dir/model.meta.json" \
  --calibrator "$artifact_dir/calibrator.json" \
  --min-ndcg-uplift 0.0 \
  --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5 \
  >/dev/null

RANKING_MODEL_PATH="$artifact_dir/model.txt" \
RANKING_MODEL_METADATA_PATH="$artifact_dir/model.meta.json" \
RANKING_CALIBRATOR_PATH="$artifact_dir/calibrator.json" \
RANKING_MODE=hybrid \
RANKING_ALLOW_UNAPPROVED_MODEL=true \
python - <<'PY'
from ltr import LTRRanker

ranker = LTRRanker()
status = ranker.status
assert status["modelLoaded"] is True, status
assert status["calibratorLoaded"] is True, status
assert status["mode"] == "hybrid", status
assert status["productionApproved"] is False, status
assert status["unapprovedOverride"] is True, status
print(f"verified {status['artifactVersion']} ({status['mode']})")
PY
