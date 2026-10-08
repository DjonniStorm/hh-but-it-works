#!/usr/bin/env sh
set -eu

python -m compileall .

# slow — бюджет производительности; порог лежит в evaluation/performance_budget.json,
# его же отдельно гоняет performance.py ниже и валит прогон при превышении.
pytest -q -m "not slow" \
  --cov=. \
  --cov-config=.coveragerc \
  --cov-report=term-missing \
  --cov-fail-under=90

python evaluation/validate_gold.py evaluation/data/sanity_gold.jsonl
python evaluation/validate_gold.py evaluation/data/gold_train.jsonl \
  --disjoint-with evaluation/data/gold_calibration.jsonl \
  --disjoint-with evaluation/data/gold_test.jsonl
python evaluation/validate_gold.py evaluation/data/gold_calibration.jsonl \
  --disjoint-with evaluation/data/gold_test.jsonl
python evaluation/validate_gold.py evaluation/data/gold_test.jsonl
python evaluation/benchmark.py evaluation/data/sanity_gold.jsonl \
  --min-ndcg 0.90 \
  --min-mrr 0.90 \
  --min-precision 0.40
python evaluation/performance.py
