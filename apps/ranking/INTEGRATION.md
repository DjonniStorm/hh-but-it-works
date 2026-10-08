# Интеграция ranking с текущим проектом

Документ специально не предлагает новый сервис или новую БД.

## 1. Регистрация кандидата

Backend хранит:

- выбранную специализацию;
- `claimedGrade`;
- preferences;
- search status.

PDF parsing — optional ускоритель. Если парсера нет, пользователь заполняет поля вручную.

## 2. Технологические тесты

Assessment/backend слой формирует для каждого навыка состояние:

```text
self_declared
queued
verified
unsupported
```

Логика лида команды ложится сюда напрямую:

- если тест на технологию существует → `queued`;
- после успешного теста → `verified` + score/confidence/evidence;
- если теста нет → `unsupported` или `self_declared`;
- если появится LLM API, им можно генерировать **черновик** задания/варианта, но после появления банк должен быть валидируемым и воспроизводимым.

В ranking передаётся `SkillEvidence` с `verificationState`, `verified`, `level`, `confidence`.

## 3. FSP mock approval

Mock ФСП может вернуть, например:

```json
{
  "language": "python",
  "title": "Открытый чемпионат",
  "year": 2026,
  "score": 0.8
}
```

Backend преобразует это в `fspEvidence`.

Ranking использует FSP как supporting evidence: сила лучшего результата, дополнительные достижения и профильность названия/дисциплины относительно потребности. Это важно: олимпиадный программист получает карьерный плюс, но грамота не доказывает автоматически FastAPI, Docker или production architecture.

## 4. Employer flow

Nest API:

1. получает HiringNeed;
2. применяет privacy/ACL;
3. делает structured/filter/retrieval candidate pool только из профилей с `verifiedGrade` в диапазоне потребности ±1;
4. передаёт описание потребности, competency sections, freshness и обезличенный профильный текст; при наличии semantic search может переопределить fallback через `semanticSimilarity`;
5. вызывает `POST /rank`;
6. возвращает результат работодателю;
7. reason codes локализует/передаёт frontend;
8. отправляет invitation только через business layer.

## 5. Feedback

После `Подходит / Не подходит` backend:

- пишет `InteractionEvent`;
- на текущую сессию может собрать `RankingContext`;
- повторно вызвать `/rank`.

Пример:

```json
{
  "context": {
    "skillBoosts": { "postgresql": 1.0, "java": -0.5 },
    "competencyBoosts": { "databases": 0.8 }
  }
}
```

Это дешёвая online personalization без обучения модели на каждый клик.

## 6. Что нельзя делать

- ranking не читает БД;
- ranking не раскрывает контакты;
- ranking не решает auth/privacy;
- ranking не генерирует тесты;
- ranking не парсит PDF в hot path;
- ranking не вызывает LLM;
- ranking не хранит события.
