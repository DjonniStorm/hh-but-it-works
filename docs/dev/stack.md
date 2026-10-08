# Библиотеки и компоненты

Версии взяты из файлов репозитория: диапазон — из `package.json` и `requirements*.txt`, установленная — из `pnpm-lock.yaml` и `apps/mock/bun.lock`. У Python lock-файла нет, там только диапазоны.

## Окружение

| Компонент  | Версия               | Где задано                                                       |
| ---------- | -------------------- | ---------------------------------------------------------------- |
| pnpm       | 12.6.0               | `packageManager` в корневом `package.json`, через corepack       |
| Node.js    | 24 (проверено 24.19) | версия не закреплена, нужен Node с corepack                      |
| TypeScript | ^6.0.3 → 6.0.3       | все TS-пакеты                                                    |
| Python     | 3.12                 | `apps/ranking/Dockerfile`, `.github/workflows/ranking-image.yml` |
| Bun        | 1                    | `apps/mock/Dockerfile` (`oven/bun:1`)                            |

## Docker-образы

`infra/dev/docker-compose.yml` и Dockerfile сервисов:

| Сервис   | Образ                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------- |
| postgres | `postgres:16-alpine`                                                                                 |
| redis    | `redis:7-alpine`                                                                                     |
| mailpit  | `axllent/mailpit:v1.27`                                                                              |
| ranking  | `ghcr.io/djonnistorm/hh-but-it-works-ranking:dev` или сборка из `apps/ranking` на `python:3.12-slim` |
| mock     | сборка из `apps/mock` на `oven/bun:1`                                                                |

## apps/api — NestJS

| Пакет                                        | Диапазон | Установлено | Зачем                                       |
| -------------------------------------------- | -------- | ----------- | ------------------------------------------- |
| `@nestjs/core`, `common`, `platform-express` | ^11.2.7  | 11.2.7      | HTTP-фреймворк                              |
| `@nestjs/config`                             | ^4.0.4   | 4.0.4       | `.env`                                      |
| `@nestjs/typeorm`                            | ^11.0.3  | 11.0.3      | связка с TypeORM                            |
| `typeorm`                                    | ^0.3.31  | 0.3.31      | ORM, `synchronize: true`                    |
| `pg`                                         | ^8.23.1  | 8.23.1      | драйвер Postgres                            |
| `ioredis`                                    | ^5.11.1  | 5.11.1      | Redis: сессии, попытки, кэш ФСП             |
| `@nestjs/bullmq`                             | ^11.0.5  | 11.0.5      | подключение BullMQ, своих очередей пока нет |
| `bullmq`                                     | ^6.3.11  | 6.3.11      | очереди на Redis                            |
| `@nestjs/jwt`                                | ^12.0.2  | 12.0.2      | access и refresh токены                     |
| `@nestjs/passport`                           | ^12.0.0  | 12.0.0      | guard'ы                                     |
| `passport`                                   | ^0.7.0   | 0.7.0       |                                             |
| `passport-jwt`                               | ^4.0.1   | 4.0.1       | Bearer                                      |
| `bcrypt`                                     | ^6.0.0   | 6.0.0       | хэш паролей                                 |
| `nodemailer`                                 | ^10.0.15 | 10.0.15     | письма подтверждения                        |
| `@nestjs/swagger`                            | ^11.4.7  | 11.4.7      | Swagger на `/docs`, `openapi.json`          |
| `nestjs-zod`                                 | ^5.5.0   | 5.5.0       | DTO и валидация из Zod-схем                 |
| `zod`                                        | ^4.6.5   | 4.6.5       | схемы                                       |
| `rxjs`                                       | ^7.8.2   | 7.8.2       | зависимость Nest                            |
| `reflect-metadata`                           | ^0.2.2   | 0.2.2       | декораторы                                  |
| `@nestjs/cli` (dev)                          | ^12.0.8  | 12.0.8      | `nest build`, `nest start --watch`          |

## apps/web — React

| Пакет                               | Диапазон | Установлено | Зачем                          |
| ----------------------------------- | -------- | ----------- | ------------------------------ |
| `react`, `react-dom`                | ^19.3.0  | 19.3.0      | UI                             |
| `react-router`                      | ^8.4.0   | 8.4.0       | маршруты                       |
| `@mantine/core`                     | ^9.6.3   | 9.6.3       | компоненты                     |
| `@mantine/form`                     | ^9.6.3   | 9.6.3       | формы, `schemaResolver`        |
| `@mantine/notifications`            | ^9.6.3   | 9.6.3       | тосты                          |
| `mobx`                              | ^7.0.6   | 7.0.6       | сторы                          |
| `mobx-react-lite`                   | ^5.1.0   | 5.1.0       | `observer`                     |
| `nuqs`                              | ^2.10.1  | 2.10.1      | вкладка профиля в query-строке |
| `@unhead/react`                     | ^3.4.2   | 3.4.2       | заголовки страниц              |
| `shiki`                             | ^4.5.0   | 4.5.0       | подсветка кода в тестах        |
| `@shikijs/langs`, `@shikijs/themes` | 4.5.0    | 4.5.0       | языки и темы shiki             |
| `@fontsource/jetbrains-mono`        | ^5.3.0   | 5.3.0       | шрифт кода                     |
| `zod`                               | ^4.6.5   | 4.6.5       | схемы форм                     |
| `vite` (dev)                        | ^8.3.2   | 8.3.2       | сборка и dev-сервер            |
| `@vitejs/plugin-react` (dev)        | ^6.1.1   | 6.1.1       |                                |
| `postcss` (dev)                     | ^8.5.28  | 8.5.28      |                                |
| `postcss-preset-mantine` (dev)      | ^1.18.0  | 1.18.0      |                                |
| `postcss-simple-vars` (dev)         | ^7.0.1   | 7.0.1       |                                |

## packages

| Пакет                   | Зависимости          | Что это                             |
| ----------------------- | -------------------- | ----------------------------------- |
| `@hh/types`             | —                    | enum и общие типы, сборка в CJS     |
| `@hh/contracts`         | `zod` ^4.6.5 → 4.6.5 | Zod-схемы запросов и ответов        |
| `@hh/assessment-engine` | `@hh/types`          | банк заданий и сборка попытки теста |

## apps/mock — реестр ФСП

| Пакет    | Диапазон | Установлено | Зачем       |
| -------- | -------- | ----------- | ----------- |
| `elysia` | `*`      | 1.4.30      | HTTP на Bun |

## apps/ranking — Python

| Пакет          | Диапазон   | Файл                                                    |
| -------------- | ---------- | ------------------------------------------------------- |
| `fastapi`      | >=0.115,<1 | `requirements.txt`                                      |
| `uvicorn`      | >=0.32,<1  | `requirements.txt`                                      |
| `pydantic`     | >=2.10,<3  | `requirements.txt`                                      |
| `lightgbm`     | >=4.5,<5   | `requirements-runtime-ml.txt`, `requirements-train.txt` |
| `scikit-learn` | >=1.5,<2   | `requirements-train.txt`, только офлайн-обучение        |
| `pytest`       | >=8,<9     | `requirements-dev.txt`                                  |
| `pytest-cov`   | >=5,<7     | `requirements-dev.txt`                                  |
| `hypothesis`   | >=6,<7     | `requirements-dev.txt`                                  |
| `httpx2`       | >=2,<3     | `requirements-dev.txt`, `TestClient`                    |

Образ ставит `requirements-runtime-ml.txt` (FastAPI, uvicorn, pydantic, lightgbm) и `libgomp1` для LightGBM.

## Инструменты репозитория

Корневой `package.json`, dev-зависимости:

| Пакет                                    | Диапазон | Установлено | Зачем                        |
| ---------------------------------------- | -------- | ----------- | ---------------------------- |
| `@hey-api/openapi-ts`                    | ^0.99.0  | 0.99.0      | клиент API из `openapi.json` |
| `eslint`                                 | ^10.12.0 | 10.12.0     | линт                         |
| `typescript-eslint`                      | ^8.71.0  | 8.71.0      |                              |
| `eslint-plugin-react-hooks`              | ^7.1.1   | 7.1.1       |                              |
| `eslint-config-prettier`                 | ^10.1.8  | 10.1.8      |                              |
| `prettier`                               | ^3.9.9   | 3.9.9       | формат                       |
| `@trivago/prettier-plugin-sort-imports`  | ^6.0.2   | 6.0.2       | порядок импортов             |
| `lefthook`                               | ^2.1.16  | 2.1.16      | git-хуки                     |
| `@commitlint/cli`, `config-conventional` | ^21.2.3  | 21.2.3      | формат сообщений коммитов    |
