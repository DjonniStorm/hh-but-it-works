# web

Кабинет кандидата и работодателя. Стек: Vite, React 19, Mantine 9, MobX, react-router 8, nuqs, Zod.

Схема: [docs/dev/architecture.md](../../docs/dev/architecture.md). Правила сторов, форм и генерации клиента: [`AGENTS.md`](../../AGENTS.md).

## Запуск

```bash
pnpm --filter @hh/web dev      # http://localhost:5173
pnpm --filter @hh/web build    # tsc -b && vite build
pnpm openapi                   # перегенерировать клиент после правки контрактов
```

Адрес API — `VITE_API_URL`, иначе `http://localhost:3000` (`apps/web/src/shared/api/hey-api.ts`).

## Структура `src`

```text
src/
  app/
    providers/          корневые провайдеры
    shell/              AuthedShell, оболочка авторизованного приложения
    store/              MobX-сторы: rootStore, auth, profile, employer, invitation,
                        error, loading, notifier, request (обёртка всех запросов)
  pages/
    auth/               LoginPage, RegisterPage, ConfirmPage
    home/               HomePage
    profile/            кабинет кандидата: навыки, ожидания, тесты (TestingLobby/Run/Result)
    invitations/        приглашения для кандидата
    employer/           компания, вакансии, подборка (MatchCard, WhyMatch, BreakdownGroup,
                        ReasonList, ScoreBar, ScoreRing), приглашения кандидатам
    test/               TestPage — служебная страница, в приложение не идёт
  shared/
    api/                сгенерированный клиент (generated/), map-*.ts мапперы в доменные типы
    router/             routes, router, ProtectedRoute, CandidateRoute, EmployerRoute, RouteError
    error/              ErrorStore -> notifier
    loader/             LoadingStore -> RequestOverlay
    lib/                labels.ts (локализация reason/warning/rejectedBy кодов), format.ts
    theme/              feedbackColor и тосты
```

## Роуты

`ROUTES` в `shared/router/routes.ts`: `/`, `/profile`, `/invitations`, `/auth/{login,register,confirm}`, `/employer`, `/employer/needs`, `/employer/needs/new`, `/employer/needs/:needId`, `/employer/needs/:needId/edit`, `/employer/invitations`, `/employer/company`, `/test`.

`ProtectedRoute` пускает только с токеном, `CandidateRoute`/`EmployerRoute` — по `role`.

## Подборка и рекомендации

`pages/employer` — единственный потребитель скоринга:

- `MatchCard` — score/ring, `BreakdownGroup` — веса групп из `MatchBreakdown`, `WhyMatch` — «почему подходит», `ReasonList` — русские тексты для кодов `reasons`/`warnings`/`rejectedBy`.
- Коды приходят с backend английскими (`verified_grade_match`, `skill_missing:python`, `must_skills_2_of_3`), переводит `shared/lib/labels.ts#reasonText`. Новый код ранжирователя = новый пункт в этом объекте, иначе в UI увидишь сырую строку.
- Score отдаётся контрактом в процентах 0..100 (см. `apps/api/src/modules/employers/ranking.client.ts`).

## Тесты

Тестовой инфраструктуры нет. Проверки перед коммитом:

```bash
pnpm build
pnpm exec eslint --max-warnings 0 apps/web/src
pnpm exec prettier --check --ignore-unknown .
```
