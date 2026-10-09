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

```bash
node apps/web/scripts/build-schools.mjs --refresh  # обновить список учебных заведений
```

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
    profile/            кабинет кандидата: анкета плитками (контакты, образование, опыт,
                        поиск работы — разделы добавляются кнопкой), навыки,
                        тесты (TestingLobby/Run/Result)
    invitations/        приглашения для кандидата
    employer/           компания, вакансии, подборка (MatchCard, WhyMatch, BreakdownGroup,
                        ReasonList, ScoreBar, ScoreRing), приглашения кандидатам
    test/               TestPage — служебная страница, в приложение не идёт
  shared/
    api/                сгенерированный клиент (generated/), map-*.ts мапперы в доменные типы
    decor/              контурные арты по теме ИТ (8 шт.) и ArtBackdrop — фон auth-страниц
                        (variant="auth") и основного приложения (variant="app": реже и
                        прозрачнее), набор и позиции собираются по хешу почты/токена
                        (model/art-layout.ts)
    router/             routes, router, ProtectedRoute, CandidateRoute, EmployerRoute, RouteError
    error/              ErrorStore -> notifier
    loader/             LoadingStore -> RequestOverlay
    lib/                labels.ts (локализация reason/warning/rejectedBy кодов), format.ts
    theme/              feedbackColor и тосты
```

## Подсказка учебных заведений

В поле «Учебное заведение» анкеты — автодополнение по списку вузов и колледжей РФ (~1000 названий). Свободный ввод сохраняется, контракт не меняется.

- `pages/profile/model/schools.ts` — сам список, сгенерирован скриптом, править руками не нужно;
- `pages/profile/model/use-schools.ts` — подтягивает список отдельным чанком, когда открыт раздел «Образование»;
- `pages/profile/ui/EducationFields.tsx` — `Autocomplete` с лимитом подсказок;
- `apps/web/scripts/build-schools.mjs` — сборка списка, сырые выгрузки падают в `ignore/schools-raw/`.

Источник сейчас — Wikidata (лицензия CC0), потому что официальный реестр Минобрнауки/ЕГАС из окружения сборки не скачивается. Когда появится выгрузка реестра, её разбор добавляется в тот же скрипт — выход и место данных в коде не меняются.

## Роуты

`ROUTES` в `shared/router/routes.ts`: `/`, `/profile`, `/invitations`, `/auth/{login,register,confirm}`, `/employer`, `/employer/needs`, `/employer/needs/new`, `/employer/needs/:needId`, `/employer/needs/:needId/edit`, `/employer/search`, `/employer/invitations`, `/employer/company`, `/test`.

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
