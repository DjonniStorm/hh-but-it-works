---
title: Код
order: 6
---

# Код

pnpm workspace: `apps/web`, `apps/api`, `apps/mock`, `packages/*`. Сервис ранжирования на Python в workspace не входит. Новые Nest-модули без согласования не заводят.

| Пакет                   | Зачем                                         |
| ----------------------- | --------------------------------------------- |
| `@hh/types`             | Enum и каталог навыков                        |
| `@hh/contracts`         | Zod-схемы запросов и ответов                  |
| `@hh/assessment-engine` | Сборка попытки, проверка ответов, целостность |

Новая или изменённая ручка: схема в `packages/contracts`, DTO в API, затем `pnpm openapi`. Клиент пишется в `apps/web/src/shared/api/generated`. Этот каталог руками не правят.

```mermaid
flowchart LR
  web[apps/web]
  api[apps/api]
  types["packages/types"]
  contracts["packages/contracts"]
  engine["packages/assessment-engine"]
  ranking[apps/ranking]
  mock[apps/mock]
  pg[(Postgres)]
  redis[(Redis)]
  web --> contracts
  web --> types
  api --> contracts
  api --> types
  api --> engine
  api --> ranking
  api --> mock
  api --> pg
  api --> redis
```

Как писать код в этом репозитории: `AGENTS.md` в корне клона и папка `docs/dev/`. Этот сайт их не копирует.
