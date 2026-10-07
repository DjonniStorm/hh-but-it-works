# infra

Окружения для запуска зависимостей и сервисов.

## `dev/`

- `docker-compose.yml` — Postgres (`5432`), Redis (`6379`), мок ФСП (`mock:3001`, собирается из `apps/mock`). Ranking сюда не входит, он поднимается отдельно.
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

В образ уходит только `requirements.txt` (fastapi, uvicorn, pydantic) — ML-зависимости для инференса не нужны. `.dockerignore` выкидывает `tests/`, `evaluation/`, `examples/`, кэши.
