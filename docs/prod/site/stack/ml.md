---
title: Ранжирование и ML
order: 3
---

# Ranking и ML

## Рекомендательная система подбора кандидатов

Сервис `apps/ranking`, обработчик `POST /rank`. Ранжирование идёт в два этапа: rules-score, затем LightGBM LTR-модель уточняет порядок. Итоговая оценка калибруется изотонической регрессией. Rules отдают `matchScore` в диапазоне `[0..1]`, Nest умножает его на 100 для UI.

Подробнее: `apps/ranking/HANDOFF.md`, контракт с Nest: `apps/ranking/INTEGRATION.md`.

### Rules-score

Считается по признакам кандидата и вакансии:

- совпадение обязательных и дополнительных навыков;
- подтверждённость навыков и грейда (подтверждённые весят больше заявленных);
- релевантность опыта;
- результаты assessment;
- зарплатные ожидания и формат работы.

Related-скилл даёт мягкую релевантность, но не закрывает strict must-have.

Если у вакансии есть `mustSkills`, а у кандидата нет ни одного из них (после каноникализации), оценка ограничивается: `min(mutual, 0.60)` в `scoring.py`, то есть не выше 60 в UI. Кандидат остаётся в выдаче, но не обгоняет тех, у кого must закрыт. Нулевую оценку даёт только hard filter (`eligibility`, в том числе strict must-have).

### LTR-модель

Модель обучена оптимизировать порядок кандидатов в выдаче, а не предсказывать решение. Она нужна, чтобы различать кандидатов с близкими rules-оценками.

В production используется готовый бандл (модель и калибратор). При запуске проверяются версия, хеш feature-кода и наличие артефактов. Обучение в runtime не выполняется.

### Семантическое сопоставление

Тексты сопоставляются локальным ONNX-эмбеддером. Если он недоступен, используется lexical fallback. Внешние сервисы и сетевые вызовы не нужны.

### Ограничения и fallback

- В hybrid-режиме LTR не переставляет двух кандидатов, если rules уже развёл их больше чем на `0.05` (`HYBRID_MAX_RULES_REORDER_GAP` в `ltr.py`), то есть на 5 баллов в UI. Внутри этой полосы порядок менять можно. Если LTR пытается пересечь границу, вес blend уменьшается.
- При ошибке загрузки артефактов или inference система переходит в rules-only режим.

### Оценка качества

Метрики: NDCG, RMSE, MAE, ECE и regression-тесты.

Калибровка считается на holdout: gold-метка `0..3` делится на 3 и сравнивается с `matchScore` (`relevanceCalibration` в `evaluate_ltr.py`). Это не вероятность найма.

Гейт для новой модели: NDCG не хуже rules-only и `LTR RMSE / rules RMSE ≤ 0.5`.

Ограничение: текущий бандл одобрен LLM-судьёй (`approvalSource: llm_judge_v1`), а не двойной ручной разметкой. Гейт ловит регрессии на синтетических и llm-gold данных и не измеряет качество на реальном рынке. LLM используется только офлайн, для разметки; в рабочем контуре его нет.

### Бандл модели

Расположение: `apps/ranking/evaluation/artifacts/ltr-v1.5.0-llm/`

Состав: `model.txt`, `model.meta.json`, `calibrator.json`, `promotion-report.json`.

Пути переопределяются переменными `RANKING_MODEL_PATH`, `RANKING_MODEL_METADATA_PATH`, `RANKING_CALIBRATOR_PATH`.

Новая версия собирается из `apps/ranking` в venv с `requirements-train.txt`. Выпущенную папку не перезаписываем, заводим новую `ltr-v1.x.y-…`:

```bash
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

Локальный gold-тир (не llm): учит во временную папку и атомарно кладёт файлы.

```bash
sh scripts/promote_ml.sh
```

Проверка бандла:

```bash
sh scripts/check_ml.sh
```

Эмбеддер собирается отдельно и не входит в LTR-бандл: части `apps/ranking/evaluation/models/embedder-int8.onnx.NNNN`, сборка командой `python scripts/build_embedder.py`.
