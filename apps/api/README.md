# api

HTTP API на NestJS. Единственный источник данных: Postgres (TypeORM, `synchronize: true`), Redis — refresh-токены, подтверждение почты, BullMQ, кэш реестра ФСП.

Модули не заводить, пока их не согласовали (см. [`AGENTS.md`](../../AGENTS.md)). Общее (`common/auth`, почта) лежит в `src/`, не внутри модуля.

## Запуск

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up   # postgres + redis + mock
cp apps/api/.env.example apps/api/.env
pnpm --filter @hh/api dev
pnpm --filter @hh/api build      # nest build
pnpm openapi                      # contracts -> openapi.json -> клиент в apps/web
pnpm start:api                    # node dist/main
```

Swagger у запущенного Nest: `http://localhost:3000/docs`. В SPA его нет, `openapi.json` в репозиторий записывается командой `pnpm openapi`.

Переменные окружения — в `.env.example`: `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_URL`, `FSP_URL` (`mock:3001`), `RANKING_URL` (`ranking:8000`). `SEED_CANDIDATE_PASSWORD` — пароль сид-кандидатов вида `seed.b101@candidates.hh.test`, в production (`NODE_ENV=production`) игнорируется.

## Структура `src`

```text
src/
  app.module.ts            TypeORM + Config + BullMQ (выключается при OPENAPI_EXPORT=1)
  main.ts, swagger.ts, openapi.ts
  health.controller.ts     GET /health
  common/auth/             JWT guard, roles guard, @CurrentUser, @Roles
  common/mail/             MailService (nodemailer) и шаблоны писем в letters/
  modules/
    users/                 User entity
    auth/                  register, confirm, login, refresh, logout, me + session store в Redis
    profiles/              профиль кандидата, навыки, каталог, сид кандидатов
    assessments/           попытки (store в Redis), attempts в Postgres, план из assessment-engine
    employers/             компания, вакансии, подборка, приглашения, интеграции с FSP и ranking
```

Каждый модуль = `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto.ts` и Entity там, где нужна таблица.

## Эндпоинты

| Префикс                 | Ручки                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /health`           | `GET`                                                                                                                                                  |
| `auth`                  | `POST register`, `confirm`, `login`, `refresh`, `logout`, `GET me`                                                                                     |
| `profile`               | `GET`, `PUT`                                                                                                                                           |
| `assessment`            | `POST attempts`, `GET attempts/current`, `POST attempts/answer`, `POST attempts/events`, `POST attempts/finish`, `GET attempts/history`                |
| `employer`              | `GET/PUT company`, `GET/POST needs`, `GET needs/:id`, `GET needs/:id/shortlist`, `PUT/DELETE needs/:id/dismissed/:candidateId`, `GET/POST invitations` |
| `candidate/invitations` | `GET`, `POST viewed`, `POST :id/accept`, `POST :id/decline`                                                                                            |

Роли: `GET /assessment/*` — кандидат, `employer/*` — работодатель.

## Подборка и рекомендательная система

`GET /employer/needs/:id/shortlist` (метод `EmployersService.shortlist`):

1. `CandidatePoolService.snapshots(profiles)` собирает `CandidateSnapshot` из Postgres: профиль, навыки, ожидания, статус поиска, плюс достижения из реестра ФСП.
2. Реестр — `FspClient` (`GET /participants/:fspId`, таймаут 2 с, кэш в Redis на час). 404 и недоступный реестр — это `[]`, подборка не падает.
3. `RankingClient.rank(need, candidates)` уходит в `POST ${RANKING_URL}/rank` (таймаут 5 с, при таймауте/ошибке — `503`, фронт повторяет до трёх раз через `loadRetry`).
4. Ответ мапится в контракт `@hh/contracts`: шкала 0..1 → 0..100, заполняются `qualification`, `opportunityFit`, `risks`, `breakdown`, `modelVersion`.

Ответы ranking **не** отдаются вебу как есть: контракт и схема ранжирователя расходятся по именам полей (`gradeFrom/gradeTo`, `salaryFrom/To`, `workFormat`, `skills[].id`), шкале (0..1 против 0..100) и набору полей. Поэтому весь маппинг живёт в одном файле — `src/modules/employers/ranking.client.ts`. Форматы и таблица соответствия: [`apps/ranking/INTEGRATION.md`](../ranking/INTEGRATION.md), текущее состояние: [`apps/ranking/HANDOFF.md`](../ranking/HANDOFF.md).

Правило: если меняется контракт подборки или схема `/rank`, правится **только** `ranking.client.ts` (+ `MapBreakdown` в `@hh/contracts`, если меняются группы).

## Тесты

`pnpm test` — срабатывает (exit 0), но тестов нет: в `package.json` отсутствует скрипт `test` и тестовая инфраструктура. Это известный пробел, покрытие планируется отдельно.

Проверки, которые реально есть:

```bash
pnpm build
pnpm exec eslint --max-warnings 0 apps/api/src
pnpm exec prettier --check --ignore-unknown .
```
