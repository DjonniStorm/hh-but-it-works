# ranking

Финальный baseline рекомендательной системы проекта. Сервис остаётся **stateless Python/FastAPI без собственной БД** и не принимает решений по auth/privacy/раскрытию контактов.

Что уже сделано, чем это покрыто тестами и что осталось: **[HANDOFF.md](HANDOFF.md)**. Форматы интеграции с Nest: **[INTEGRATION.md](INTEGRATION.md)**.

## Готовый запуск без обучения

Версионированные `model.txt`, metadata, calibrator и held-out report лежат в
[`evaluation/artifacts/ltr-v1.5.0-llm`](evaluation/artifacts/ltr-v1.5.0-llm). Обычная
Docker-сборка только устанавливает runtime и копирует готовую модель — LightGBM
training и scikit-learn при сборке/запуске не выполняются.

Workflow `Publish pre-trained ranking image` публикует готовый multi-arch
образ по push в `dev`, **но сейчас Actions на аккаунте выключен** — раны не
выполняются, GHCR-тег `:dev` может отставать от репозитория. Всегда сверяй
`modelVersion` в `/health` (должен быть `hybrid-v1.3.0-ltr0.25`):

```bash
docker pull ghcr.io/djonnistorm/hh-but-it-works-ranking:dev
docker run --rm -p 8000:8000 \
  ghcr.io/djonnistorm/hh-but-it-works-ranking:dev
curl -s localhost:8000/health   # modelLoaded: true, modelVersion: hybrid-v1.3.0-ltr0.25
curl -s -X POST localhost:8000/rank -H 'content-type: application/json' \
  --data @apps/ranking/examples/rank-request.json
```

Надёжный путь без CI — собрать локально из клона; сборка только копирует
committed artifacts, ничего не обучает:

```bash
docker compose --env-file infra/dev/.env.example \
  -f infra/dev/docker-compose.yml up -d --build ranking
```

Для private GHCR один раз нужен `docker login ghcr.io`; package можно сделать public
в GitHub Packages.

### Проверка PR: CI выключен, всё вручную

Воркфлоу `ranking-image.yml` есть, но Actions отключён — раны не выполняются
и PR-теги не публикуются. Ревьюер проверяет локально:

```bash
cd apps/ranking && sh scripts/check.sh && sh scripts/check_ml.sh  # тесты + ML-гейты
pnpm test                                                          # api + web контракт
docker compose --env-file infra/dev/.env.example \
  -f infra/dev/docker-compose.yml up -d --build ranking            # образ с моделью
curl -s localhost:8000/health
```

Демо-запрос (`examples/rank-request.json`) содержит трёх кандидатов: middle с
4 годами опыта идёт первым, junior с 1.1 года — вторым, junior ниже
`experienceMin` — третьим с пониженным компонентом `experience`.

### Локальный запуск без Docker

```bash
pip install -r apps/ranking/requirements-runtime-ml.txt
cd apps/ranking && uvicorn main:app --port 8000   # hybrid + committed bundle
```

Без артефактов сервис честно откатывается на pure rules (`rules-v1.3.0`) —
`/health` покажет `modelLoaded: false`.

## Контекст продукта

Кандидат регистрируется и выбирает заявленный грейд. Backend/assessment слой может:

1. распарсить PDF резюме, если эта функция подключена;
2. поставить доступные технологические тесты в очередь;
3. пометить технологии без готового теста как неподтверждённые/unsupported;
4. при наличии LLM API сгенерировать черновик теста — это **не является обязательной зависимостью ranking**;
5. получить mock/реальное FSP evidence: язык, олимпиадные результаты, грамоты;
6. передать в ranking уже структурированный `CandidateSnapshot`.

Ranking никогда не считает self-declared skill равным verified skill.

## `POST /rank`

Pipeline:

```text
hard eligibility
→ skill normalization / evidence-aware feature extraction
→ QualificationScore
→ OpportunityFit
→ IntentScore
→ reciprocal MatchScore
→ deterministic reasons/warnings
```

В живом employer flow Nest допускает в candidate pool только профили с
`verifiedGrade` в диапазоне потребности ±1. Поддержка `claimedGrade` в `/rank`
остаётся для совместимости, диагностики и других потенциальных сценариев, но
не открывает доступ в verified shortlist.

### Hard filters

- hidden candidate;
- strict specialization;
- strict verified/claimed grade minimum;
- strict salary;
- strict work mode;
- strict location;
- strict must-have technologies.

Related technologies могут давать мягкий relevance, но **не удовлетворяют strict must-have**.

### QualificationScore

Учитывает:

- specialization;
- verified/claimed grade и gradeConfidence;
- must/nice skills;
- verified evidence;
- competency scores;
- assessment;
- experience (для Nest диапазон лет разворачивается из грейда вакансии, см. INTEGRATION);
- precomputed semantic similarity, локальный ONNX-embedding в неоднозначном lexical band или объяснимый lexical fallback по текстам;
- профильный FSP evidence bonus с силой и количеством достижений.

### OpportunityFit

Учитывает candidate preferences:

- salary;
- work mode;
- target specialization.

Локация, тип занятости и желаемый стек **выведены из формулы в `rules-v1.3.0`**: в контракте нет полей, которыми их заполнить (см. HANDOFF §5).

### IntentScore

- `actively_looking`;
- `open_to_offers`;
- `passive`;
- freshness профиля.

`hidden` отсекается eligibility.

### Mutual Match

Это fit-score 0..1, **не калиброванная вероятность найма**.

## Feedback / персонализация

`RankRequest.context` принимает короткоживущие `skillBoosts` и `competencyBoosts` в диапазоне `[-1, 1]`.

Слагаемое персонализации выведено из формулы в `rules-v1.3.0`: boost'ам неоткуда
прийти из текущего контракта, и константа в формуле — худшее состояние.
`competencyBoosts` остаётся живым модификатором внутри слагаемого компетенций;
`skillBoosts` зарезервирован под будущую петлю обратной связи (dismiss/invite,
issue #36 §6) и на score сейчас не влияет. Событие «Подходит / Не подходит»
backend логирует `InteractionEvent` для будущего обучения.

## Explainability

Ответ возвращает:

- `qualificationScore`;
- `opportunityFit`;
- `intentScore`;
- `matchScore`;
- `components`;
- `reasons`;
- `warnings`;
- `rejectedBy`;
- `modelVersion`.

Reason/warning codes детерминированы, поэтому frontend/API может безопасно локализовать их без LLM.

## FSP

FSP — supporting evidence с весом `0.06`, а не gate. Отсутствие истории ФСП не снижает кандидата до нуля.

`fspEvidence` поддерживает язык/название достижения/год/score. Компонент учитывает лучший результат, небольшой бонус за дополнительные достижения и lexical-профильность дисциплины относительно потребности. Непрофильное достижение сохраняет коэффициент `0.70`, потому что всё равно является подтверждённым сигналом.

## Career GPS

`POST /career/analyze` делает counterfactual-анализ:

- считает текущие strong matches;
- собирает market gaps;
- различает `verify_skill` и `learn_and_verify_skill`;
- симулирует улучшение;
- ранжирует Next Best Actions по фактическому uplift числа сильных совпадений.

LLM не используется.

## LLM policy

LLM **не находится в hot path**.

Допустимо снаружи ranking:

- one-time CV parsing fallback;
- optional HiringNeed parsing;
- offline/supervised generation черновиков тестов;
- explicit candidate coach, который объясняет уже посчитанные факты.

Отключение LLM/API не ломает matching.

## Semantic retrieval

Если передан `semanticSimilarity`, сервис использует его как precomputed feature. Для пар без него Nest передаёт описание потребности и обезличенный текст из специализации/навыков кандидата, а ranking сначала считает детерминированный lexical coverage/Jaccard: при score вне band `[0.20, 0.60]` (явный match/mismatch) остаётся lexical, внутри band решение принимает локальный int8 ONNX-энкодер (`evaluation/models/embedder-int8.onnx`, `paraphrase-multilingual-MiniLM-L12-v2` с pinned revision) — cosine переводится в ту же шкалу `[0, 1]`. Сетевых вызовов и LLM нет; недоступность модели (`onnxruntime`/`tokenizers`, несовпадение sha с `embedder.meta.json`, `RANKING_EMBEDDINGS=off`) детектируется по `embeddingReady` в `/health` и молча возвращает lexical. Совпавшие lexical-термы по-прежнему уходят в reason codes (`semantic_overlap:*`), без обоих текстов остаётся нейтральный `0.65`.

Рекомендованная интеграция позже (для масштаба, сейчас не требуется):

- embeddings пересчитываются при изменении профиля/HiringNeed;
- хранятся в Postgres/pgvector;
- Nest формирует candidate pool;
- ranking только сортирует snapshots.

## V1 Learning-to-Rank

LTR-контур работает как production-safe shadow/hybrid:

- `evaluation/gold.py` воспроизводимо строит controlled-synthetic набор вокруг обезличенных публичных вакансий и делит его по `need.id`/source entity на train/calibration/test;
- relevance-метки задаются явными сценариями qualification/intent, независимо от rules-score; `labelConfidence` используется как sample weight;
- `evaluation/open_data.py` нормализует локальные JSON-выгрузки, отбрасывая работодателя, адреса и контакты; `data_quality.py` ставит PII/leakage gate;
- `evaluation/human_labels.py` экспортирует blind CSV (готовый батч `evaluation/annotation/batch-001`, гайд аннотатора `evaluation/annotation/README.md`) и принимает двойные оценки с adjudication-решениями, валит батч при PII, неполноте или согласии ниже 0.6;
- `evaluation/train_ltr.py` учит LightGBM LambdaRank только на train и fit-ит `IsotonicRegression` только на calibration;
- `evaluation/evaluate_ltr.py` сравнивает rules, pure LTR и hybrid на untouched test по NDCG/Precision/MRR и диагностике калибровки;
- runtime загружает `model.txt`, `model.meta.json` и безопасный `calibrator.json`, проверяет schema, feature order, SHA-256 кода признаков и артефактов;
- любая ошибка загрузки/предикта безопасно возвращает `rules-v1.3.0`; hard filters LTR не переопределяет.
- `scripts/promote_ml.sh` атомарно публикует локальные артефакты только после entity/group-disjoint quality gate;
- Docker runtime build копирует проверенный versioned artifact bundle и никогда не обучает модель.

`evaluation/data/gold*.jsonl` — **controlled-synthetic benchmark**, а не человеческий gold. Потребности основаны на небольшой атрибутированной выборке открытых вакансий, кандидаты вымышлены, метки независимы от rules. Набор проверяет pipeline и ловит регрессии, но не доказывает production uplift. Карточка и provenance: [`evaluation/data/README.md`](evaluation/data/README.md), [`evaluation/data/SOURCES.json`](evaluation/data/SOURCES.json).

Training metadata содержит `productionApproved` и `approvalSource`. Обычный runtime не даёт неутверждённому артефакту влиять на выдачу: запрос `hybrid`/`ltr` будет понижен до `shadow`. Готовый образ по умолчанию собирается с llm-approved бандлом `ltr-v1.5.0-llm` (`approvalSource: llm_judge_v1`), поэтому `/health` честно показывает `productionApproved=true`, `unapprovedOverride=false` без каких-либо override-переменных. Флаг `--production-approved` принимается только для `human_double_annotation_v1`; отдельный, более слабый флаг `--llm-approved` принимает только `llm_judge_v1` — см. `evaluation/annotation/README.md` и `evaluation/artifacts/`.

Режимы `RANKING_MODE`:

| Режим    | Поведение                                                                  |
| -------- | -------------------------------------------------------------------------- |
| `rules`  | Только детерминированный baseline                                          |
| `shadow` | Rules в ответе, LTR agreement/score delta/drift только в monitoring        |
| `hybrid` | `0.75·rules + 0.25·calibrated LTR`; human-approved или явный demo override |
| `ltr`    | Pure LTR для offline evaluation и будущего rollout на human-labeled data   |

Вес hybrid задаётся `RANKING_LTR_WEIGHT` и валидируется в `[0,1]`. Без валидных или approved (human/llm) артефактов активный ответ fail-closed остаётся rules/shadow; явный `RANKING_ALLOW_UNAPPROVED_MODEL=true` остаётся только как debugging-инструмент и в дефолтный образ не входит.

Scikit-learn нужен только при обучении. Serving использует LightGBM и собственный JSON isotonic runtime без pickle/joblib. Локально:

```bash
pip install -r requirements-ml.txt
sh scripts/check_ml.sh
sh scripts/promote_ml.sh                 # строит и атомарно проверяет локальные артефакты

python evaluation/train_ltr.py evaluation/data/gold_train.jsonl \
  --calibration-dataset evaluation/data/gold_calibration.jsonl \
  --output model.txt \
  --metadata model.meta.json \
  --calibrator calibrator.json
python evaluation/evaluate_ltr.py evaluation/data/gold_test.jsonl \
  --model model.txt \
  --metadata model.meta.json \
  --calibrator calibrator.json \
  --min-ndcg-uplift 0.0 \
  --min-hybrid-ndcg-uplift 0.0 \
  --max-calibration-rmse-ratio 0.5
```

Пути можно переопределить через `RANKING_MODEL_PATH`, `RANKING_MODEL_METADATA_PATH`, `RANKING_CALIBRATOR_PATH`. Pure LTR и hybrid нельзя включать в production до независимой двойной human-разметки. На committed controlled-synthetic holdout LTR обязан не уступать rules по NDCG@5 и как минимум вдвое улучшать calibration RMSE. Rules отдельно обязан обгонять naïve baseline; это regression criteria, не заявление о рыночном качестве.

### Данные и лицензии

Практический sourcing-план находится в [`evaluation/DATA_SOURCING.md`](evaluation/DATA_SOURCING.md). Коротко: вакансии можно брать из официальных открытых данных «Работы России» с атрибуцией; навыки и связи профессия↔навык — из ESCO/O*NET по их открытым лицензиям. Реальные резюме, отклики и outcome-данные берутся только по договору/consent и после удаления PII. Scraping/перепубликация HH в этот pipeline не заложены.

## Monitoring

Каждый `/rank` пишет в logger `ranking.metrics` одну JSON-строку: версия/режим модели, latency, размеры eligible/rejected пула, min/mean/max score, pairwise agreement rules↔LTR, top-5 overlap, score delta и feature drift относительно train distribution. Идентификаторы кандидатов и содержимое профиля в лог не попадают. `/health` показывает режим, readiness, версии и ошибки валидации артефактов.

## Benchmark

```bash
python evaluation/benchmark.py evaluation/data/sanity_gold.jsonl
python evaluation/benchmark.py evaluation/data/gold_test.jsonl --compare-naive
```

Метрики:

- NDCG@5;
- NDCG@10;
- Precision@5;
- MRR.

На текущем entity-disjoint holdout rules v1.1 обгоняет naïve baseline
`категория + assessment + candidate id` на `+0.235 NDCG@5`, `+0.20 P@5` и
`+0.333 MRR`.

## Dev

Python 3.12 (системный 3.9 не подходит). Венв — **вне** каталога `apps/ranking`, иначе `scripts/check.sh` начнёт компилировать его содержимое.

```bash
python3.12 -m venv ../rank-venv && source ../rank-venv/bin/activate
pip install -r requirements-dev.txt      # + requirements-ml.txt для LTR (нужен libomp)
sh scripts/promote_ml.sh                 # обучить, проверить и атомарно сохранить артефакты
uvicorn main:app --reload --port 8000

sh scripts/check.sh                     # compileall + pytest + gold + benchmark + perf
sh scripts/check_ml.sh                  # reproducibility + LightGBM + isotonic + held-out eval
```

Все проверки одной командой, именно её гонять перед коммитом:

```text
python -m compileall .
pytest -q
python evaluation/validate_gold.py evaluation/data/sanity_gold.jsonl
python evaluation/benchmark.py evaluation/data/sanity_gold.jsonl
python evaluation/performance.py --candidates 1000 --runs 2
python evaluation/validate_gold.py evaluation/data/gold_test.jsonl
```

Docker использует уже обученный versioned bundle и сразу запускает готовый demo hybrid:

```bash
docker build -t hh-ranking .
docker run --rm -p 8000:8000 hh-ranking
curl -s localhost:8000/health
```
