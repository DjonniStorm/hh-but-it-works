#!/usr/bin/env sh
set -eu

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

python evaluation/gold.py --output-dir "$tmp_dir/generated"
cmp evaluation/data/gold.jsonl "$tmp_dir/generated/gold.jsonl"
cmp evaluation/data/gold_train.jsonl "$tmp_dir/generated/gold_train.jsonl"
cmp evaluation/data/gold_calibration.jsonl "$tmp_dir/generated/gold_calibration.jsonl"
cmp evaluation/data/gold_test.jsonl "$tmp_dir/generated/gold_test.jsonl"

sh scripts/verify_artifacts.sh evaluation/artifacts/ltr-v1.2.0 evaluation/data/gold_test.jsonl
sh scripts/verify_artifacts.sh evaluation/artifacts/ltr-v1.3.0-llm evaluation/data/llm_gold_test.jsonl

pytest -q -m ml
sh scripts/promote_ml.sh "$tmp_dir/artifacts" > "$tmp_dir/promotion.log"
RANKING_MODEL_PATH="$tmp_dir/artifacts/model.txt" \
RANKING_MODEL_METADATA_PATH="$tmp_dir/artifacts/model.meta.json" \
RANKING_CALIBRATOR_PATH="$tmp_dir/artifacts/calibrator.json" \
RANKING_MODE="hybrid" \
RANKING_ALLOW_UNAPPROVED_MODEL="true" \
python - <<'PY'
import json
from pathlib import Path

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
payload = json.loads(Path("examples/rank-request.json").read_text(encoding="utf-8"))
response = client.post("/rank", json=payload)
assert response.status_code == 200, response.text
body = response.json()
assert body["modelVersion"] == "hybrid-v1.2.0-ltr0.25"
assert body["results"]
assert all(item["modelVersion"] == body["modelVersion"] for item in body["results"])
health = client.get("/health").json()
assert health["ranker"]["modelLoaded"] is True
assert health["ranker"]["calibratorLoaded"] is True
print(f"service smoke: {len(body['results'])} ranked, {body['modelVersion']}")
PY
RANKING_MODEL_PATH="evaluation/artifacts/ltr-v1.3.0-llm/model.txt" \
RANKING_MODEL_METADATA_PATH="evaluation/artifacts/ltr-v1.3.0-llm/model.meta.json" \
RANKING_CALIBRATOR_PATH="evaluation/artifacts/ltr-v1.3.0-llm/calibrator.json" \
RANKING_MODE="hybrid" \
python - <<'PY'
import json
from pathlib import Path

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
payload = json.loads(Path("examples/rank-request.json").read_text(encoding="utf-8"))
response = client.post("/rank", json=payload)
assert response.status_code == 200, response.text
body = response.json()
assert body["results"]
health = client.get("/health").json()
assert health["ranker"]["modelLoaded"] is True
assert health["ranker"]["calibratorLoaded"] is True
assert health["ranker"]["mode"] == "hybrid", health["ranker"]
assert health["ranker"]["productionApproved"] is True, health["ranker"]
assert health["ranker"]["unapprovedOverride"] is False, health["ranker"]
print(
    f"llm-approved smoke: {len(body['results'])} ranked, "
    f"{body['modelVersion']} via {health['ranker']['artifactVersion']}"
)
PY
python evaluation/evaluate_ltr.py evaluation/data/gold_test.jsonl \
  --model "$tmp_dir/artifacts/model.txt" \
  --metadata "$tmp_dir/artifacts/model.meta.json" \
  --calibrator "$tmp_dir/artifacts/calibrator.json" \
  --min-ndcg-uplift 0.0 \
  --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5
