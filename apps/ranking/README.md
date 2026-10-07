# ranking

Финальный baseline рекомендательной системы проекта. Сервис остаётся **stateless Python/FastAPI без собственной БД** и не принимает решений по auth/privacy/раскрытию контактов.

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
- experience;
- optional semantic similarity;
- небольшой FSP evidence bonus;
- session personalization.

### OpportunityFit

Учитывает candidate preferences:

- salary;
- work mode;
- location;
- employment type;
- target specialization;
- desired stack.

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

Это позволяет backend после `Подходит / Не подходит` уточнить текущую выдачу без online retraining. Событие при этом должно логироваться backend-ом для будущего обучения.

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

FSP — supporting evidence, а не gate. Отсутствие истории ФСП не снижает кандидата до нуля.

`fspEvidence` поддерживает простую mock-модель: язык/название достижения/год/score. При наличии списка из него выводится небольшой `fspEvidenceScore`.

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

Этот сервис принимает `semanticSimilarity` как precomputed feature. Сам embeddings/vector storage не хранит.

Рекомендованная интеграция позже:

- embeddings пересчитываются при изменении профиля/HiringNeed;
- хранятся в Postgres/pgvector;
- Nest формирует candidate pool;
- ranking только сортирует snapshots.

## V1 Learning-to-Rank

`evaluation/train_ltr.py` теперь умеет обучать optional LightGBM LambdaRank на gold JSONL dataset.

Production dependency на LightGBM специально не добавлена. Устанавливать:

```bash
pip install -r requirements-ml.txt
python evaluation/train_ltr.py data/gold.jsonl --output model.txt
```

Модель нельзя включать в production, пока held-out benchmark не показывает стабильный uplift над `rules-v1.0.0`.

## Benchmark

```bash
python evaluation/benchmark.py data/gold.jsonl
```

Метрики:

- NDCG@5;
- NDCG@10;
- Precision@5;
- MRR.

## Dev

```bash
python -m pip install -r requirements-dev.txt
pytest -q
python -m compileall .
uvicorn main:app --reload --port 8000
```
