---
title: Инфраструктура
order: 6
---

# Инфраструктура решения

## Организация кода

Код организован как монорепозиторий на базе pnpm workspaces. Внутренние пакеты переиспользуются напрямую, без публикации и версионирования. Зависимости хранятся в общем хранилище pnpm, поэтому не дублируются на диске.

Воркспейсы:

- `packages/types`, `packages/contracts`, `packages/assessment-engine`
- `apps/web`, `apps/api`, `apps/mock`
- `apps/ranking` в pnpm-workspace не входит

## Сервисы и развертывание

Локальные зависимости (тот же файл, что в [локальном запуске](/how/local)):

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
```

В этом compose: postgres, redis, mailpit, ranking, mock. API и кабинет с хоста: `pnpm --filter @hh/api dev` (`:3000`) и `pnpm --filter @hh/web dev` (`:5173`).

Стенд [hire.eegov.net](https://hire.eegov.net) поднимает `infra/prod`: postgres, redis, mock, ranking, api, web. Наружу смотрит Caddy.

| Сервис   | Назначение                     | Где                          | Порт        |
| -------- | ------------------------------ | ---------------------------- | ----------- |
| postgres | Данные кабинета                | `infra/dev` и `infra/prod`   | 5432        |
| redis    | Сессии, попытка теста, кэш ФСП | `infra/dev` и `infra/prod`   | 6379        |
| mailpit  | Письма: SMTP и ящик            | только `infra/dev`           | 1025 / 8025 |
| ranking  | Ранжирование, `POST /rank`     | `infra/dev` и `infra/prod`   | 8000 (dev)  |
| mock     | Реестр ФСП                     | `infra/dev` и `infra/prod`   | 3001 (dev)  |
| api      | Nest                           | pnpm локально / `infra/prod` | 3000        |
| web      | Кабинет                        | pnpm локально / `infra/prod` | 5173 / 80   |

## Веб-сервер

Используем Caddy: минимальный конфиг (Caddyfile) и [автоматическая выдача и продление SSL-сертификатов](https://caddyserver.com/docs/automatic-https). Достаточно указать домен. Caddy отдаёт SPA, `/api` проксирует на `api:3000`, `$FSP_DOMAIN` целиком на `mock:3001`.
