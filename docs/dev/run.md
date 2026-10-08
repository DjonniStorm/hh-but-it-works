# Сборка и локальный запуск

Весь стенд с нуля на одной машине: инфраструктура в Docker, API и веб из исходников. Развёртывание на сервер — отдельная инструкция (задача #24).

Все команды — из корня репозитория.

## Что нужно

- Git.
- Node.js 24 с corepack. pnpm ставить не нужно: версию 12.6.0 из `packageManager` подтягивает `corepack pnpm`.
- Docker с compose v2 (Docker Desktop, на macOS можно OrbStack). Демон должен быть запущен.
- Python 3.12 — только для проверок `apps/ranking`. Сам сервис идёт в контейнере.

Свободные порты: `5432`, `6379`, `1025`, `8025`, `8000`, `3001` для compose, `3000` для API, `5173` для веба.

## 1. Зависимости

```bash
corepack pnpm install
```

Если после этого изменился `pnpm-lock.yaml` — не коммитить: `git checkout pnpm-lock.yaml`.

## 2. Инфраструктура

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up -d
```

| Сервис   | Порт       | Что                                                     |
| -------- | ---------- | ------------------------------------------------------- |
| postgres | 5432       | база `hh`, логин и пароль `hh`                          |
| redis    | 6379       | сессии, попытки теста, кэш ФСП                          |
| mailpit  | 1025, 8025 | SMTP для писем, ящик в браузере `http://localhost:8025` |
| ranking  | 8000       | ранжирование, готовая модель внутри образа              |
| mock     | 3001       | мок реестра ФСП                                         |

Ranking берётся готовым образом `ghcr.io/djonnistorm/hh-but-it-works-ranking:dev`. Нет доступа к GHCR — собрать из исходников: `docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml build ranking`.

Проверка:

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml ps
curl localhost:8000/health                      # {"status":"ok","service":"ranking","modelVersion":...}
curl localhost:3001/participants/fsp-b104       # два достижения ФСП
```

## 3. Переменные API

```bash
cp apps/api/.env.example apps/api/.env
```

Пример уже рабочий для локального стенда: адреса compose, `SMTP_HOST=localhost` и `SMTP_PORT=1025` на Mailpit. `SMTP_HOST` обязателен, без него API не стартует.

Чтобы входить под сид-кандидатами, раскомментировать в `apps/api/.env`:

```text
SEED_CANDIDATE_PASSWORD=seed-candidate
```

`.env` в git не попадает. Настоящие SMTP-креды держать только там.

## 4. Сборка пакетов

API берёт `@hh/types`, `@hh/contracts` и `@hh/assessment-engine` из их `dist`, поэтому пакеты собираются до первого запуска API и после каждой их правки:

```bash
corepack pnpm -r --filter "./packages/*" build
```

Веб смотрит на исходники пакетов через алиасы Vite, ему сборка не нужна.

## 5. API

```bash
corepack pnpm dev:api
```

`nest start --watch`, порт `3000` (`PORT` в `.env`). Таблицы создаёт TypeORM (`synchronize: true`), миграций нет. При первом старте в логе:

```text
[CandidateSeedService] Сид-кандидатов создано: 21
[CandidateSeedService] Вход под сид-кандидатами открыт: 21
[NestApplication] Nest application successfully started
```

Вторая строка — только с `SEED_CANDIDATE_PASSWORD`. Проверка: `curl localhost:3000/health` → `{"status":"ok"}`, Swagger — `http://localhost:3000/docs`.

## 6. Веб

Во втором терминале:

```bash
corepack pnpm dev:web
```

Vite на `http://localhost:5173`. API по умолчанию `http://localhost:3000`, другой адрес — `VITE_API_URL`. CORS API пускает только `localhost:5173` и `localhost:5174`.

На Windows Vite может слушать только IPv6 `[::1]`, и браузер не откроет `localhost:5173`. Тогда так:

```bash
corepack pnpm dev:web --host 127.0.0.1
```

## 7. Пройти сценарий

1. Зарегистрироваться работодателем или кандидатом на `http://localhost:5173`.
2. Письмо с подтверждением открыть в Mailpit, `http://localhost:8025`, перейти по ссылке.
3. Работодатель: профиль компании → потребность → подборка. Сид-кандидаты уже на бирже, проверка отбора по шагам — [matching.md](matching.md#отбор-на-сид-данных).
4. Кандидат: войти как `seed.b101@candidates.hh.test` (и так далее по кодам сида) с паролем из `SEED_CANDIDATE_PASSWORD`, ответить на приглашение.

## Сборка без dev-режима

```bash
corepack pnpm build                      # пакеты, затем API и веб
cd apps/api && node dist/main            # API читает .env из текущей папки
corepack pnpm --filter @hh/web preview   # собранный веб, http://localhost:4173
```

Собранный веб ходит в API по `VITE_API_URL` на момент сборки. CORS API пускает только `5173` и `5174`, поэтому для проверки в браузере preview запускать с `--port 5174`.

## Проверки перед коммитом

```bash
corepack pnpm build
corepack pnpm test                                   # 5 contract tests API, 3 теста веба
corepack pnpm exec eslint --max-warnings 0 .
corepack pnpm exec prettier --check --ignore-unknown .
sh apps/ranking/scripts/check.sh                     # ML-часть, Python 3.12
```

На Windows с `core.autocrlf=true` общий `prettier --check` ругается на CRLF почти во всех файлах. Тогда проверять только свои: `corepack pnpm exec prettier --check <файлы>`.

## Второй стенд рядом

Если `:3000` и база `hh` уже заняты своим API, второй API поднимается на той же инфраструктуре с отдельной базой:

```bash
docker exec dev-postgres-1 psql -U hh -d hh -c "CREATE DATABASE hh_local2"
```

В `apps/api/.env` этой копии: `PORT=3004`, `DATABASE_URL=postgres://hh:hh@localhost:5432/hh_local2`. Веб к нему: `VITE_API_URL=http://localhost:3004 corepack pnpm dev:web --host 127.0.0.1 --port 5174`.

## Остановить

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml down      # данные Postgres остаются
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml down -v   # и база с нуля
```
