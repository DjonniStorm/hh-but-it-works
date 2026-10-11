---
title: Ранжирование и ML
order: 3
---

# Ранжирование и ML

Сервис `apps/ranking`, ручка `POST /rank`. Сначала детерминированный rules-score, затем LightGBM LambdaRank уточняет порядок среди близких. Оценка калибруется изотонической регрессией. Rules отдают `matchScore` в `[0..1]`, Nest умножает на 100 для UI.

Подробнее в репозитории: `apps/ranking/HANDOFF.md`, контракт: `apps/ranking/INTEGRATION.md`. Цифры LTR ниже из `evaluation/artifacts/ltr-v1.5.0-llm/promotion-report.json`. В HANDOFF местами ещё старый hybrid +0.026: смотрите отчёт.

Архитектура готова к работе с реальной обратной связью. Утверждать, что подборка лучше hh.ru, LinkedIn или Eightfold, нельзя: нет двойной human-разметки, invite/dismiss, A/B и fairness-аудита на живых данных.

## Что делает рынок, что делаем мы

| Кто                                                                                                                                               | Как подбирает                                                     | Чем силён                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| [hh.ru «Умный поиск»](https://hh.ru/article/28087)                                                                                                | Много параметров вакансии и резюме, поведение, история            | Объём реальных откликов и приглашений                             |
| [LinkedIn Recruiter](https://www.linkedin.com/help/linkedin/answer/a413241/recommended-matches-in-recruiter?lang=en-US)                           | Навыки, профиль, локация, Open to Work, Save / Hide / Message     | Граф и персонализация по действиям рекрутера                      |
| [Eightfold](https://eightfold.ai/wp-content/uploads/eightfold_ai_talent_intelligence_platform_datasheet.pdf)                                      | Matching по навыкам и карьерной траектории                        | Свои датасеты траекторий (их цифры, не наши)                      |
| [Workday HiredScore](https://doc.workday.com/admin-guide/en-us/workday-feature-descriptions/workday-hiredscore/hiredscore-ai-for-recruiting.html) | Оценка A-D, Fit & Gap по требованиям                              | ATS и разбор каждого требования                                   |
| Мы                                                                                                                                                | Hard filters, rules-score, LambdaRank, калибровка, локальный ONNX | Подтверждённые навыки, объяснения, хеши бандла, fallback на rules |

## Rules и модель

Rules считают совпадение must/nice навыков, заявленное против подтверждённого грейда и навыка, assessment, опыт, зарплату, формат, ФСП. Related-скилл даёт мягкую релевантность и не закрывает strict must-have. Нет ни одного must после каноникализации: `min(mutual, 0.60)` в `scoring.py`, в UI не выше 60. Ноль даёт только hard filter (`eligibility`).

LTR учится порядку в группе, не «принять / отказать». Вес hybrid: `0.75` rules + `0.25` калиброванный LTR (`RANKING_LTR_WEIGHT`). Зазор rules больше `0.05` (5 баллов в UI): модель пару не переворачивает (`HYBRID_MAX_RULES_REORDER_GAP`). Если тянет через границу, вес blend режется. Hard filters модель не трогает. Сломанный артефакт или inference: ответ rules-only, в версии модели это видно.

Ответ не одно число: `qualification`, `opportunityFit`, `intent`, причины, риски, дыры по требованиям, `modelVersion`. В кабинете это «почему подходит», не «AI так решил».

## Семантика

Сначала lexical coverage / Jaccard. Явный match или mismatch (вне полосы `[0.20, 0.60]`) эмбеддер не зовёт. Внутри полосы: локальный int8 ONNX (`paraphrase-multilingual-MiniLM-L12-v2`). Нет сети, нет LLM в этом контуре. Нет onnxruntime или `RANKING_EMBEDDINGS=off`: lexical, `/health` показывает `embeddingReady`.

## Метрики (holdout, не рынок)

Rules против naïve (`категория + assessment + id`) на entity-disjoint controlled-synthetic: `+0.235` NDCG@5, `+0.20` Precision@5, `+0.333` MRR (`apps/ranking/README.md`). Это regression к тупому базису, не сравнение с hh.

LTR против rules на `llm_gold_test`, три группы:

|          | NDCG@5 | NDCG@10 | Precision@5 |  MRR |
| -------- | -----: | ------: | ----------: | ---: |
| Rules    | 0,9617 |  0,9615 |        0,60 | 1,00 |
| Pure LTR | 1,0000 |  1,0000 |        0,60 | 1,00 |
| Hybrid   | 0,9798 |  0,9805 |        0,60 | 1,00 |

Uplift NDCG@5: LTR `+0,0383`, hybrid после rail `+0,0182`. Калибровка на том же holdout: rules MAE 0,2467 / RMSE 0,3036 / ECE 0,2403; у калиброванного LTR ошибки порядка `10^-7`. Почти ноль не есть рыночная точность: групп мало, LLM-метки повторили сценарный порядок (Kendall tau 1.0 в provenance). Гейт пайплайна: NDCG не хуже rules и RMSE калибровки не больше половины rules.

Бандл `ltr-v1.5.0-llm`: 18 признаков, 120 train-строк в 15 группах, 24 calibration, LambdaRank 200 деревьев и 3 листа, seed 42, один поток. Калибратор JSON, без pickle. Runtime сверяет SHA-256 модели, калибратора и кода признаков. Обучения в образе нет.

Бюджет rules-бенчмарка: не дольше 1,4 с на 1000 кандидатов (`performance_budget.json`). Заметка в файле: на ноутбуке около 0,655 с. Это не p95 HTTP hybrid.

LLM только офлайн, для `llm_judge_v1`. В `POST /rank` его нет.

## Бандл

Каталог: `apps/ranking/evaluation/artifacts/ltr-v1.5.0-llm/` (`model.txt`, `model.meta.json`, `calibrator.json`, `promotion-report.json`). Пути: `RANKING_MODEL_PATH`, `RANKING_MODEL_METADATA_PATH`, `RANKING_CALIBRATOR_PATH`.

Новая папка `ltr-v1.x.y-…`, старую не перезаписываем:

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

Локальный gold без llm-флага: `sh scripts/promote_ml.sh`. Проверка: `sh scripts/check_ml.sh`.

Эмбеддер не в LTR-бандле: куски `evaluation/models/embedder-int8.onnx.NNNN`, сборка `python scripts/build_embedder.py`.
