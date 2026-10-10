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

### Ошибки в Swagger

У каждой ручки описаны коды ошибок, которые она реально отдаёт, со схемой `ApiErrorDto` (`apiErrorSchema` в `@hh/contracts`): `statusCode`, `message`, необязательные `error` и `errors`. `errors` — замечания Zod, приходят с `400`, когда тело не прошло схему.

- `@Auth(...roles)` из `common/auth` вешает guard'ы, `ApiBearerAuth` и описывает их ошибки: `401` всегда, `403` если указаны роли. Guard'ы руками на контроллер не ставить.
- `@ApiErrors({ 404: "…", 409: "…" })` из `common/openapi` — коды самой ручки с пояснением, когда она их отдаёт. Новое исключение в сервисе — строка здесь.

Переменные окружения — в `.env.example`: `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_URL`, `FSP_URL` (`mock:3001`), `RANKING_URL` (`ranking:8000`). `SEED_CANDIDATE_PASSWORD` — пароль сид-кандидатов вида `seed.b101@candidates.hh.test`, в production (`NODE_ENV=production`) игнорируется.

## Структура `src`

```text
src/
  app.module.ts            TypeORM + Config + BullMQ (выключается при OPENAPI_EXPORT=1)
  main.ts, swagger.ts, openapi.ts
  health.controller.ts     GET /health
  common/auth/             @Auth (guard'ы + их ошибки в Swagger), JWT guard, roles guard, @CurrentUser, @Roles
  common/openapi/          @ApiErrors и ApiErrorDto: коды ошибок ручек в Swagger
  common/mail/             MailService (nodemailer) и шаблоны писем в letters/
  common/fsp/              FspClient: достижения из реестра ФСП (подборка и PDF-профиль)
  modules/
    users/                 User entity
    auth/                  register, confirm, confirm/resend, password/forgot, password/reset, login, refresh, logout, me + session store в Redis
    profiles/              профиль кандидата, навыки, каталог, сид кандидатов
    assessments/           попытки (store в Redis), attempts в Postgres, план из assessment-engine
    employers/             компания, вакансии, подборка, приглашения, интеграции с FSP и ranking
```

Каждый модуль = `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto.ts` и Entity там, где нужна таблица.

## Эндпоинты

| Префикс                 | Ручки                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /health`           | `GET`                                                                                                                                                                                                                                      |
| `auth`                  | `POST register`, `confirm`, `confirm/resend` (раз в минуту на адрес, ответ не выдаёт, есть ли пользователь), `password/forgot` (так же), `password/reset` (выход на всех устройствах), `login`, `refresh`, `logout`, `GET me`              |
| `profile`               | `GET`, `PUT`                                                                                                                                                                                                                               |
| `assessment`            | `POST attempts`, `GET attempts/current`, `POST attempts/answer`, `POST attempts/events`, `POST attempts/finish`, `GET attempts/history`                                                                                                    |
| `employer`              | `GET/PUT company`, `GET/POST needs`, `GET/PUT/DELETE needs/:id` (удаление мягкое), `GET needs/:id/shortlist`, `POST candidates/search` (банк кандидатов, первые 50), `PUT/DELETE needs/:id/dismissed/:candidateId`, `GET/POST invitations` |
| `candidate/invitations` | `GET`, `POST viewed`, `POST :id/accept`, `POST :id/decline`                                                                                                                                                                                |

Роли: `GET /assessment/*` — кандидат, `employer/*` — работодатель.

## PDF-профиль

- `GET /profile/export.pdf?template=ditto|gengar|pikachu` — кандидат скачивает свою анкету. Без `template` — Ditto.
- `GET /employer/invitations/:id/resume.pdf?template=…` — то же резюме для работодателя, только по его принятому приглашению. До принятия — `404`.

Рисует `profiles/resume-pdf` на pdf-lib + fontkit, без браузера. Раскладки, кегли и отступы сняты с эталонных PDF шаблонов Ditto, Gengar и Pikachu из [Reactive Resume](https://github.com/AmruthPillai/Reactive-Resume) (MIT): заголовки Merriweather, текст Inter, иконки Phosphor (MIT). Цвета из брендбука, как в теме веба: шапки, заголовки, линии и шкалы — основной `#402FFF`, подложки — его светлый оттенок, навык с подтверждением ФСП — акцент `#EC1D35`, заявленный — серый. Шрифты (OFL) лежат в `src/assets`. Фото в анкете нет: на его месте плитка с инициалами.

Флаги `show*` действуют так же, как в подборке: скрытые стаж, зарплата, достижения ФСП и неподтверждённые навыки в PDF не попадают. Имя и контакты печатаются: PDF отдаёт сам кандидат или работодатель получает его после принятия. Опыт работы и образование берутся из анкеты (`experience`, `education`) в порядке, который задал кандидат. Описание опыта в несколько строк печатается списком.

## Подборка и рекомендательная система

`GET /employer/needs/:id/shortlist` (метод `EmployersService.shortlist`):

1. `CandidatePoolService.snapshots(profiles)` собирает `CandidateSnapshot` из Postgres: профиль, навыки, ожидания, статус поиска, плюс достижения из реестра ФСП.
2. Реестр — `FspClient` (`GET /participants/:fspId`, таймаут 2 с, кэш в Redis на час). 404 и недоступный реестр — это `[]`, подборка не падает.
3. `RankingClient.rank(need, candidates)` уходит в `POST ${RANKING_URL}/rank` (таймаут 5 с, при таймауте/ошибке — `503`, фронт повторяет до трёх раз через `loadRetry`).
4. Ответ мапится в контракт `@hh/contracts`: шкала 0..1 → 0..100, заполняются `qualification`, `opportunityFit`, `risks`, `breakdown`, `modelVersion`.
5. `categories` — рекомендованные категории: грейды потребности (`exact`) и по ступени вокруг (`adjacent`) с числом кандидатов без отклонённых. Список грейдов — `categoriesOf` в `candidate-pool.service.ts`, по нему же отбирает `eligible`.

Поиск по банку (`POST /employer/candidates/search`, `CandidatePoolService.search`) берёт тех же кандидатов биржи (`onExchange`) и отдаёт тот же `CandidateSnapshot`: алиас, без контактов. Фильтры: специализация, подтверждённые грейды, стек (все навыки, без учёта регистра), подтверждение ФСП (`hasFspEvidence` из `@hh/contracts`). Без потребности ранжировать не по чему, поэтому сортировка по баллу теста; выдача ограничена `candidateSearchLimit` (50), `total` — сколько подошло всего.

Потребность удаляется мягко (`deletedAt`): отправленные по ней приглашения остаются в силе и с названием, отметки «Не подходит» и избранное удаляются.

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
