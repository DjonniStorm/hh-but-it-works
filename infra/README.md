# infra

Окружения для запуска зависимостей и сервисов.

## `dev/`

- `docker-compose.yml` — Postgres (`5432`), Redis (`6379`), ranking (`8000`) и мок ФСП (`mock:3001`).
- `.env.example` — креды для этого compose (`POSTGRES_USER=hh`, `POSTGRES_PASSWORD=hh`, `POSTGRES_DB=hh`).

Запуск из корня:

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
```

`apps/api` ходит в эти сервисы по адресам из `apps/api/.env` (см. `DATABASE_URL`, `REDIS_URL`, `FSP_URL`, `RANKING_URL`).

## `prod/`

Пока пусто (`.gitkeep`). Чек-лист деплоя сюда не переносим, пока он не согласован.

## Ranking

Контейнер собирается из корня:

```bash
docker build -t hh-ranking-test apps/ranking
docker run -p 8000:8000 hh-ranking-test
curl -s localhost:8000/health
```

Модель уже обучена и лежит в `apps/ranking/evaluation/artifacts/ltr-v1.2.0`.
Docker build только копирует model/metadata/calibrator/report в минимальный runtime:
scikit-learn и обучение ему не нужны. Workflow `ranking-image.yml` публикует
готовые `amd64`/`arm64` образы в
`ghcr.io/djonnistorm/hh-but-it-works-ranking` с тегами `dev`, `main`, git SHA и
release tag. `docker-compose.yml` использует готовый образ, если он доступен.

Артефакт по умолчанию — llm-approved `ltr-v1.4.0-llm`: `/health` показывает
`productionApproved=true` без override-переменных. Human-approved артефакт —
следующий tier после двойной human-разметки; `RANKING_ALLOW_UNAPPROVED_MODEL`
остаётся только debugging-инструментом.
