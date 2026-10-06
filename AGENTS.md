# Как устроен репозиторий

pnpm workspace. `apps/web` — Vite, React, Mantine, MobX, react-router. `apps/api` — Nest, TypeORM, Postgres, Redis, BullMQ, Swagger. `packages/types` — enum и общие типы. `packages/contracts` — Zod-схемы запросов и ответов, их же ест API. `apps/mock` и `apps/ranking` к текущей авторизации не относятся.

Доменные модули API лежат в `apps/api/src/modules`. Общее (`common/auth`, почта) и конфиг приложения — в `apps/api/src`, не внутри модуля. Новые модули не заводить, пока их не согласовали. Пользователь живёт в Postgres. Refresh и токен подтверждения почты — ключи в Redis, не таблицы. SMTP нет: `MailService` пишет ссылку в лог. Ссылка ведёт на веб: `WEB_URL/auth/confirm?token=...`.

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
