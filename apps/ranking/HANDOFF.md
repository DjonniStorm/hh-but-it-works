# HANDOFF — рекомендательная система (`apps/ranking`)

Полное описание того, что уже сделано по рекомендательной системе: контекст, спека, состояние, что покрыто тестами, где разрывы, что дальше.

Формат: **документация** (как пользоваться) → **системный анализ** (как это устроено и что не сходится) → **хэндофф** (что делать следующему).

Техническое описание самого сервиса — [`README.md`](README.md), сценарии интеграции — [`INTEGRATION.md`](INTEGRATION.md).

---

## 1. Статус на 2026-10-08

| Блок                      | Состояние                                                              |
| ------------------------- | ---------------------------------------------------------------------- |
| Сервис `POST /rank`       | Rules/shadow/hybrid/LTR; ready image запускает demo hybrid             |
| `POST /career/analyze`    | Counterfactual-действия на том же активном ранкере                     |
| `GET /health`             | Работает, отдаёт `modelVersion`                                        |
| Интеграция с Nest         | Работает, маппинг в `apps/api/src/modules/employers/ranking.client.ts` |
| UI-объяснения             | Работают: `breakdown`, `reasons`, `risks` → «Почему подходит»          |
| Тесты Python              | 239 pytest (238 fast + 1 slow), включая 6 ML smoke                     |
| Docker-образ              | Pre-trained bundle, GHCR multi-arch publish, без обучения на старте    |
| LTR (lightgbm)            | Demo hybrid готов; production lock остаётся видимым в metadata/health  |
| Мониторинг                | Latency/pool/score/agreement/drift без PII на каждый `/rank`           |
| Semantic/competency/fresh | Живые fallback/sections/freshness передаются из Nest                   |
| Тесты Nest/веб            | ML-граница: 5 API contract tests + 3 web mapping/label tests           |
| CI                        | Ranking image: test + bundle verify + multi-arch GHCR publish          |

**Ни один сервис, БД или Nest-модуль не добавлялся.** `ranking` остаётся stateless: ни хранилища, ни очередей, ни LLM в горячем пути.

---

## 2. Что сделано

### 2.1 Сервис

- `schemas.py` — Pydantic-модели входа/выхода: `RankRequest` (алиасы `vacancy` и `hiringNeed`, ровно одна из двух), `CandidateSnapshot`, `HiringNeedSnapshot`, `RankingContext`, `ScoreBreakdown`, `RankItem`, `CareerAnalyzeRequest/Response`.
- `scoring.py` — весь скоринг: hard filters (`eligibility`), три под-оценки, геометрическая сборка `matchScore`, reason/warning-коды, сортировка `rank_candidates`. Версия модели `MODEL_VERSION = "rules-v1.1.0"` — единая точка истины, её же отдаёт `/health`.
- `career.py` — `analyze_career`: сильные матчи сейчас, действия (профит/улучшение), пробелы по навыкам.
- `taxonomy.py` — нормализация имён навыков (латиница/кириллица/`c++`/`go`), таблица `RELATED`, `canonical_skill`, `skill_match`.
- `ltr.py` — безопасная загрузка артефактов, checksum/schema/feature-code guard, rules/shadow/hybrid/LTR и fail-closed fallback.
- `calibration.py` — inference isotonic из проверяемого JSON без pickle/joblib.
- `monitoring.py` — privacy-safe JSON-метрики прогона.
- `main.py` — три ручки FastAPI и выбор фактически использованной версии модели.
- `Dockerfile` + `.dockerignore` — `python:3.12-slim`, runtime-зависимости и готовый versioned artifact bundle; обучения при build/start нет.

### 2.2 Оценка качества

- `evaluation/validate_gold.py` — группы, rich labels, PII и entity leakage.
- `evaluation/benchmark.py` — `ndcg@k`, `precision@k`, `mrr` по `evaluation/data/sanity_gold.jsonl`.
- `evaluation/performance.py` — синтетическая нагрузка, avg latency и throughput.
- `evaluation/gold.py` — real-vacancy-grounded controlled synthetic: 21 публичная обезличенная вакансия, 168 вымышленных профилей, независимые от rules multidimensional labels и entity-disjoint splits. Это не human gold.
- `evaluation/open_data.py` + `data_quality.py` — PII-free normalization локальных open-data выгрузок и quality gates.
- `evaluation/human_labels.py` — blind CSV, двойная независимая разметка и обязательный adjudication конфликтов.
- `evaluation/train_ltr.py` + `features.py` — offline LTR по breakdown и rules-агрегатам, isotonic calibration, выход `model.txt` + `model.meta.json` + безопасный `calibrator.json`.
- `evaluation/evaluate_ltr.py` — held-out сравнение rules/pure LTR/hybrid и два quality gate.
- `evaluation/data/sanity_gold.jsonl` — 12 пар, 3 группы, метки 0..3.
- `scripts/check.sh` — compileall → pytest → validate → benchmark → performance.
- `scripts/check_ml.sh` — reproducibility → ML tests → atomic promotion → FastAPI hybrid smoke → held-out gates.
- `scripts/promote_ml.sh` — атомарная локальная публикация model/metadata/calibrator/report только после gate.

### 2.3 Покрытие тестами (239 pytest, 91.42 % statement coverage)

`tests/test_ranking.py` — 22 теста: каноникализация алиассов, порядок кандидатов, все hard filters, verified vs claimed grade, строгие must-have, бонус verified-навыка, нейтральность FSP, обратная совместимость `vacancy`, ошибки валидации, `health`, легаси-поле `score`, комбинация `hiringNeed`+`vacancy`, hidden-кандидат, relocation, intent по availability/freshness.
`tests/test_career.py` — 4 теста: counterfactual-действие, приоритет верификации над прокачкой, пустой рынок, посторонняя специализация.
`tests/test_examples.py` — 2 теста: `examples/rank-request.json` и `examples/career-request.json` из README проходят валидацию и исполняются.

### 2.4 Интеграция с остальным репозиторием

- `apps/api/src/modules/employers/ranking.client.ts` — адаптер контракт ↔ `/rank` (таблица соответствия в `INTEGRATION.md`), шкала ×100, заполнение `qualification`/`opportunityFit`/`risks`/`breakdown`, таймаут 5 с → `503`.
- `apps/api/src/modules/employers/employers.service.ts` — `shortlist` использует реальный `modelVersion`, а не заглушку.
- `apps/web/src/shared/lib/labels.ts` — `reasonText()` переводит reason/warning/rejectedBy коды, включая составные (`skill_missing:python`, `must_skills_2_of_3`).
- `apps/web/src/pages/employer/ui/{ReasonList,WhyMatch}.tsx` — отображение причин и групп `breakdown`.

---

## 3. Как это устроено (системный анализ)

### 3.1 Поток данных

```mermaid
flowchart LR
  W[web] -->|GET needs/:id/shortlist| A[api]
  A --> P[CandidatePoolService<br/>listed + verified grade ±1]
  A --> F[FspClient<br/>mock:3001, кэш Redis]
  A -->|POST /rank<br/>5s timeout| R[ranking]
  R -->|results 0..1| C[ranking.client.ts<br/>маппинг + ×100]
  C --> A
  A -->|Shortlist 0..100| W
```

Соглашение о вине: **правила отбора в пул — бизнес-логика Nest, оценка — `apps/ranking`.** Пул отсекает по специализации и подтверждённому грейду ±1; кандидат без `verifiedGrade` в подборку не попадает. Ranking отвечает за порядок и объяснения внутри уже верифицированного пула.

### 3.2 Формулы

Три под-оценки, все в `[0..1]`:

```text
qualification = 0.09·специализация + 0.14·грейд        + 0.20·must
              + 0.09·must(только verified)             + 0.03·nice
              + 0.12·компетенции                       + 0.10·assessment
              + 0.09·опыт                              + 0.07·semantic
              + 0.06·fsp                               + 0.01·персонализация   = 1.00

opportunity   = 0.35·зарплата + 0.22·формат + 0.12·локация
              + 0.08·занятость + 0.13·целевая роль + 0.10·желаемый стек         = 1.00

intent        = availability[1.0 | 0.90 | 0.58 | 0] · (0.62 + 0.38·freshness)

matchScore    = eligibility_ok ? Q^0.55 · O^0.30 · I^0.15 : 0
```

`matchScore` — **геометрическое** среднее с нулевым показателем намеренно: слабое звено роняет итог сильнее, чем линейная компенсация. Нелинейность `Q^0.55` даёт «плюс за крохи» в верхней части шкалы.

Hard filters (`eligibility`), любой срабатывает → `matchScore = 0`, кандидат остаётся в выдаче с `rejectedBy`:

| Код                           | Условие                                    |
| ----------------------------- | ------------------------------------------ |
| `candidate_hidden`            | `availability = hidden`                    |
| `specialization_mismatch`     | строгая специализация (в контракте всегда) |
| `grade_below_minimum`         | `strictGrade`                              |
| `salary_incompatible`         | `strictSalary` — в Nest всегда `true`      |
| `work_mode_incompatible`      | `strictWorkMode` — в Nest всегда `true`    |
| `location_incompatible`       | `strictLocation`                           |
| `critical_must_skill_missing` | `strictMustSkills`                         |

В Nest: `strictSalary=true`, `strictWorkMode=true`, `strictGrade/strictMustSkills/strictLocation=false` — потому что пул уже отфильтрован по грейду, а бюджет и формат работодателя считаются жёсткими.

Reasons (почему подходит, максимум 7) / warnings (риски, максимум 8) — `_reasons_and_warnings`, коды переведены в `labels.ts`.

### 3.3 Верификация и доверие

Центральное правило продукта «verified talent matching» реализовано в четырёх местах:

1. `_grade_fit`: `verifiedGrade` домножается на `0.80 + 0.20·gradeConfidence`, `claimedGrade` — на `0.72` (заявленный не бесполезен, но слабее).
2. `_best_skill_score`: verified даёт `+0.08`, не-verified штрафуется `×0.78`.
3. `qualification` содержит отдельный слагаемый `0.09·verified_must` поверх `0.20·must`.
4. `verificationState` (`self_declared/queued/verified/unsupported`) нормализуется в `SkillEvidence` валидатором: `verified → state=verified`, и наоборот.

### 3.4 Детерминизм

Ни случайности, ни часов, ни внешних вызовов внутри `score_pair`. Один и тот же вход → побайтово тот же выход, поэтому и `rules-v1.1.0` в `/health`, и золотой набор детерминированы. Это же главный актив для будущих тестов (см. §6).

---

## 4. Как пользоваться

```bash
# окружение: Python 3.12 (системный 3.9 не подходит), вне apps/ranking!
python3.12 -m venv ../rank-venv
source ../rank-venv/bin/activate
pip install -r requirements-dev.txt
# для LTR дополнительно: pip install -r requirements-ml.txt  (+ brew install libomp)

# запуск
uvicorn main:app --port 8000
# либо контейнер
docker build -t hh-ranking apps/ranking && docker run -p 8000:8000 hh-ranking

# все проверки
sh scripts/check.sh

# поштучно
pytest -q
python evaluation/validate_gold.py evaluation/data/sanity_gold.jsonl
python evaluation/benchmark.py evaluation/data/sanity_gold.jsonl
python evaluation/performance.py --candidates 1000 --runs 2
sh scripts/check_ml.sh
sh scripts/promote_ml.sh
```

Готовые запросы — `examples/rank-request.json`, `examples/career-request.json`. Zod-совместимость с ними гарантирует `tests/test_examples.py`.

Венв **не должен** лежать в `apps/ranking/`: `check.sh` гоняет `python -m compileall .` по каталогу и начнёт компилировать содержимое venv.

---

## 5. Разрывы между моделью и живым контрактом

Модель полная, но Nest передаёт часть полей с дефолтами. Проверено чтением `ranking.client.ts`:

| Сигнал                         | В модели                                        | В живом запросе   | Эффект                                                            |
| ------------------------------ | ----------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `semanticSimilarity`           | `0.07·semantic`, embedding или lexical fallback | тексты передаются | перестал быть константой; precomputed embedding всё ещё поддержан |
| `context.skillBoosts/…`        | `0.01·персонализация`, дефолт 0.5               | не передаётся     | константа 0.5 до feedback integration                             |
| `profileFreshness`             | в `intent`, шкала 1.0/0.7/0.4                   | передаётся        | считается Nest от последнего assessment/profile signal            |
| `competencyWeights` (need)     | `0.12·компетенции`                              | передаются        | must=1.0, nice=0.35                                               |
| `competencies` (candidate)     | score секций теста                              | передаются        | reason `strong_competency:*` при score ≥ 0.75                     |
| `experienceMin/Max`            | `0.09·опыт`                                     | не передаются     | всегда дефолт 0.80                                                |
| `locations`, `employmentTypes` | `0.12·локация`, `0.08·занятость`                | не передаются     | нейтральный 0.75                                                  |
| `desiredSkills`                | `0.10·желаемый стек`                            | не передаются     | нейтральный 0.75                                                  |
| `salaryMax`, `relocation`      | в `opportunity`                                 | не передаются     | грубее оценка зарплаты/локации                                    |

Итог: в живом запросе работают специализация, грейд, навыки, секции assessment, freshness, lexical semantic fallback, профильный FSP, зарплата, формат и целевая роль. Из подготовленных сигналов не подключена только session personalization.

Дополнительно: без артефактов `ModelVersion` в ответе — `rules-v1.1.0`. Готовый образ — `hybrid-v1.1.0-ltr0.25`; pure artifact отдельно виден как `ltr-v1.1.0-calibrated`. При любой ошибке загрузки или предикта запрос получает rules fallback и честную версию `rules-v1.1.0`.

---

## 6. Ограничения и риски

1. **Gold-набор — regression, а не рыночный.** Основной набор содержит 168 controlled-synthetic пар вокруг 21 реальной публичной вакансии; кандидаты и labels всё ещё синтетические.
2. **Demo hybrid активирован явным override.** На entity-disjoint holdout он не уступает rules по NDCG@5 и более чем вдвое улучшает calibration RMSE. Metadata и `/health` честно показывают `productionApproved=false`, `unapprovedOverride=true`.
3. **Lexical semantic — fallback, не embedding.** Он объясним и живой, но не понимает глубокую семантику; внешний embedding может переопределить его без изменения контракта.
4. **CI есть для ranking image.** Workflow проверяет код и bundle, затем публикует multi-arch GHCR image; остальной monorepo всё ещё не имеет полного общего CI.
5. **Nest покрыт только на ML-границе.** Пять contract tests фиксируют live-сигналы, отсутствие PII, verified-only pool, UI-веса, freshness-границы и порядок/версию `shortlist`; остальная бизнес-логика Nest пока без unit tests.
6. **Web покрыт только на ML-границе.** Три unit tests фиксируют динамические reason-коды, группу ФСП и передачу freshness; React-компоненты карточки отдельно не тестируются.
7. **Fallback при недоступности — `503`.** Подборка не отдаётся вообще. Альтернатива (показать список без оценок) не реализована — это продуктовое решение, не ошибка.
8. **Набор причин хрупок:** `reasons[:7]`/`warnings[:8]` обрезают молча, порядок кодов = порядок построения, а не значимость.
9. **Рыночных judgments пока нет.** Инфраструктура open-data ingestion, synthetic bootstrap, double annotation, sample weights, calibration и activation lock готова; следующий внешний шаг — разметить обезличенные пары экспертами.

---

## 7. Хэндофф

### 7.1 Точка входа для нового инженера/агента

1. [`docs/dev/AGENT_HANDOFF.md`](../../docs/dev/AGENT_HANDOFF.md) — правила репозитория, команды, как не сломать чужое.
2. [`README.md`](README.md) — спека сервиса, формулы, коды причин.
3. [`INTEGRATION.md`](INTEGRATION.md) — что передаёт Nest и почему.
4. `scoring.py` — единственное место с формулами. Менять веса только вместе с обновлением этой таблицы и `breakdownGroups` в `ranking.client.ts`.
5. `scripts/check.sh` — перед любым коммитом.

### 7.2 Правила при доработке

- Меняешь формулу/веса → обнови **одновременно**: `MODEL_VERSION` (следующая minor/major версия), веса в `breakdownGroups` (`ranking.client.ts`), таблицу в `README.md` и `HANDOFF.md`, gold-набор, если порядок пар меняется.
- Меняешь контракт `/rank` → правишь только адаптер, `@hh/contracts` не трогаешь (см. `contracts/README.md`).
- Новый код reason/warning → пункт в `apps/web/src/shared/lib/labels.ts`, иначе в UI увидишь `skill_foo`.
- Доменные числа для eval (навыки, бюджеты, веса компетенций) добавляются только в `factories.py` (общая синтетика: `need()`, `backend_need()`, `candidate()`, `synthetic_candidate()`, её же гоняют eval-скрипты). Тесты держат свой минимальный словарь намеренно (одна гипотеза — один набор полей), gold-набор — размеченные данные: их не унифицируем.
- Списки констант, продублированные между языками (веса `qualification`/`opportunity` ↔ `breakdownGroups`, `FEATURE_ORDER` ↔ `ScoreBreakdown`, `taxonomy.py` ↔ `skill-catalog.ts`), сверяются автотестами в `tests/test_invariants.py`, а не вручную.
- Пороги качества и скорости живут рядом с кодом и валят прогон сами: `scripts/check.sh` — покрытие ≥ 90 %, `evaluation/benchmark.py --min-ndcg/--min-mrr`, бюджет `evaluation/performance_budget.json`. Ответ `/rank` зафиксирован снапшотом `tests/snapshots/` (обновить: `UPDATE_SNAPSHOTS=1 pytest tests/test_snapshot.py`).
- Медлительные и ML-прогоны не в основном контуре: `pytest -m "not slow"` в `check.sh`, обучение LTR помечено `ml` и требует `requirements-ml.txt`.
- Ни в коем случае не добавляй в `apps/ranking`: БД, Redis, очереди, HTTP-вызовы в `score_pair`, LLM в горячем пути.
- Корневые рабочие ML-артефакты (`model.txt`, `model.meta.json`, `calibrator.json`, `promotion-report.json`) и локальные кэши в git не попадают. Только immutable release bundles в `evaluation/artifacts/ltr-v*/` коммитятся и проверяются по SHA-256.

### 7.3 Что делать дальше

Заведённые issues по ML-части, в порядке приоритета:

1. [#34 — план полного покрытия тестами](https://github.com/DjonniStorm/hh-but-it-works/issues/34): **completed** (PR #38, 183 теста, покрытие 98 %).
2. [#35 — интеграционные тесты Nest ↔ ranking и CI](https://github.com/DjonniStorm/hh-but-it-works/issues/35): маппинг адаптера, `shortlist`, веб-переводы, workflow.
3. [#36 — довести модель до идеала](https://github.com/DjonniStorm/hh-but-it-works/issues/36): ML-продукт готов локально и в Docker: deterministic data, LTR, portable isotonic, rules/shadow/hybrid/LTR rollout, atomic promotion, held-out gates, drift/agreement monitoring, fallback. Внешний остаток — human-labeled judgments и подключение дополнительных сигналов в Nest-контракте.
