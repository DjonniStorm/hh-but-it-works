#!/usr/bin/env sh
set -eu

ranking_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
artifact_dir="${1:-$ranking_dir}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cd "$ranking_dir"
python evaluation/train_ltr.py evaluation/data/gold_train.jsonl \
  --calibration-dataset evaluation/data/gold_calibration.jsonl \
  --output "$tmp_dir/model.txt" \
  --metadata "$tmp_dir/model.meta.json" \
  --calibrator "$tmp_dir/calibrator.json"
python evaluation/evaluate_ltr.py evaluation/data/gold_test.jsonl \
  --model "$tmp_dir/model.txt" \
  --metadata "$tmp_dir/model.meta.json" \
  --calibrator "$tmp_dir/calibrator.json" \
  --min-ndcg-uplift 0.0 \
  --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5 \
  > "$tmp_dir/promotion-report.json"

mkdir -p "$artifact_dir"
for artifact in model.txt model.meta.json calibrator.json promotion-report.json; do
  cp "$tmp_dir/$artifact" "$artifact_dir/$artifact.next"
  mv "$artifact_dir/$artifact.next" "$artifact_dir/$artifact"
done

cat "$artifact_dir/promotion-report.json"
printf 'promoted ML artifacts to %s\n' "$artifact_dir"
