# Как устроен репозиторий

pnpm workspace. `apps/web` — Vite, React, Mantine, MobX, react-router. `apps/api` — Nest, TypeORM, Postgres, Redis, BullMQ, Swagger. `packages/types` — enum и общие типы. `packages/contracts` — Zod-схемы запросов и ответов, их же ест API. `apps/mock` и `apps/ranking` к текущей авторизации не относятся.

Доменные модули API лежат в `apps/api/src/modules`. Общее (`common/auth`, почта) и конфиг приложения — в `apps/api/src`, не внутри модуля. Новые модули не заводить, пока их не согласовали. Пользователь живёт в Postgres. Refresh, токен подтверждения почты и токен сброса пароля — ключи в Redis, не таблицы. Почта — `common/mail`, nodemailer. Шаблоны — `common/mail/letters`: письмо собирает `renderLetter` из простого текста и сам экранирует HTML. Сейчас писем четыре: подтверждение почты, сброс пароля, кандидату — новое приглашение, работодателю — ответ на приглашение. `SMTP_HOST` обязателен, без него API не стартует. Письма уходят в фоне, запрос их не ждёт. Локально — Mailpit из `infra/dev` (`SMTP_HOST=localhost`, `SMTP_PORT=1025`, ящик на `http://localhost:8025`), настоящая отправка — Яндекс, креды только в своём `apps/api/.env`. Ссылки ведут на веб: `WEB_URL/auth/confirm?token=...` и `WEB_URL/auth/reset?token=...`.

Swagger только у запущенного Nest: `http://localhost:3000/docs`. В SPA его нет.

## Клиент API

Контракт один: схемы в `@hh/contracts`, ручки описывает Nest, клиент генерируется.

1. Поменять схему в `packages/contracts` и DTO в API, если ручка изменилась.
2. `pnpm openapi` — собирает contracts, пишет `apps/api/openapi.json`, гоняет `@hey-api/openapi-ts`.
3. Конфиг генератора: `openapi-ts.config.ts`. Выход: `apps/web/src/shared/api/generated`. `runtimeConfigPath` — `apps/web/src/shared/api/hey-api.ts` (`VITE_API_URL` или `http://localhost:3000`).

`generated/` не править руками. Плагин React Query и вторая генерация Zod не нужны. Клиент с `throwOnError: false` возвращает `{ data, error }`. Bearer: `client.setConfig({ auth: () => accessToken })` в auth-сторе.

`@hh/types` собирается в CJS, и Vite не импортирует из него enum `Role` как named export. В `apps/web/vite.config.ts` алиасы `@hh/types` и `@hh/contracts` смотрят на исходники пакетов. Ответы API в доменные типы переводит `apps/web/src/shared/api/map-session.ts`, не стор.

## Сторы

Сторы — `apps/web/src/app/store`. Мапперы и сгенерированный клиент остаются в `shared`.

`rootStore` — синглтон. У каждого стора своё `readonly key` из `StoreKey`. Корень регистрирует их в `Map` и в `StoreMap`. Снаружи: `useStore(StoreKey.Auth)` или `useRootStore()`. Стор держит ссылку на корень, она не observable.

Любой запрос идёт через `request(root, run, options)`:

- `loader: true` — действие, которого ждёт человек: вход, регистрация, подтверждение, выход, открытие профиля. В `LoadingStore` кладётся id, `RequestOverlay` висит, пока набор id не пуст. `refresh` и `me` с `loader: false`.
- ошибка всегда попадает в `ErrorStore`. Тот зовёт `notifier.showError`, потом необязательный `onError`.
- `onSuccess` вызывается только после успеха.
- клиентский `{ error }` считается провалом, даже без throw.

Цвета тостов не писать в сторе. `Notifier` берёт их из `feedbackColor` в `apps/web/src/shared/theme`.

Новый стор: значение в `StoreKey`, класс с `readonly key`, поле в `RootStore`, ветка в `StoreMap`, `register` в конструкторе корня.

## Формы

`@mantine/form` и схема из `@hh/contracts`. Zod 4 — Standard Schema, поэтому валидатор такой:

```tsx
const form = useForm({
  initialValues: { email: "", password: "" },
  validate: schemaResolver(loginSchema, { sync: true }),
});
```

`schemaResolver` импортируется из `@mantine/form`. Отдельного `zodResolver` в Mantine 9 нет. `{ sync: true }` нужен: без него резолвер возвращает `Promise`, хотя Zod синхронный. Ошибки полей ставит резолвер. В сабмите схему ещё раз не парсить и свой `setFieldError` не писать.

## Код

- Тело стрелки, `if`, `for`, `while` всегда в `{ }`. Не `() => value` и не `if (ok) return`.
- Имя компонента один раз: `export const LoginPage = observer(() => { ... })`. Не `observer(function LoginPage`.
- Если из имён не ясно, зачем строка, добавь короткий комментарий-лид над этим местом.

## Компоненты

Один компонент — один файл. Второй компонент в тот же файл не писать.

Файл компонента короче 300 строк. Если не влезает — дробить.

У компонента своя папка:

- `ui` — компоненты
- `model` — хелперы, типы и константы экрана, без разметки

Пример: `pages/profile/ui/ProfilePage.tsx`, опции селектов — `pages/profile/model`.

## Документация

Индекс всех доков — [`docs/README.md`](docs/README.md). Обязательно до начала работы:

- [`docs/dev/AGENT_HANDOFF.md`](docs/dev/AGENT_HANDOFF.md) — системный контекст, команды, подводные камни, что нельзя делать.
- [`docs/dev/architecture.md`](docs/dev/architecture.md), [`docs/dev/model.md`](docs/dev/model.md) — схема и модель данных.
- [`docs/dev/testing-validation.md`](docs/dev/testing-validation.md) — как устроены тесты кандидатов.

README в каждой поддиректории (`apps/*`, `packages/*`, `infra/`, `docs/`) описывает, что там лежит и как запускается:

| Где                           | Что                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `apps/README.md`              | карта приложений и связи между ними                                                |
| `apps/api/README.md`          | модули, эндпоинты, env, интеграция с ranking и FSP                                 |
| `apps/web/README.md`          | структура, роуты, сторы, подборка в UI                                             |
| `apps/mock/README.md`         | мок реестра ФСП и правило синхронизации с сидом                                    |
| `apps/ranking/README.md`      | спека сервиса, формулы, коды причин                                                |
| `apps/ranking/HANDOFF.md`     | **что уже сделано по рекомендательной системе**: статус, системный анализ, хэндофф |
| `apps/ranking/INTEGRATION.md` | форматы контракта Nest ↔ `/rank`                                                   |
| `packages/README.md`          | общие пакеты и правило «кто что импортирует»                                       |
| `infra/README.md`             | compose, окружения, сборка контейнера ranking                                      |
