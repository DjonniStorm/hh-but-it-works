---
title: Локальный запуск
order: 2
---

# Локальный запуск

Кабинет и API у себя на машине: смотреть сценарий, письма, мок ФСП. Прод на сервере не нужен.

Нужны Node (pnpm), Docker и клон репозитория. Ранжирование в compose уже есть, Python для просмотра кабинета не обязателен.

## Поднять зависимости

Из корня:

```bash
pnpm install
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
cp apps/api/.env.example apps/api/.env
pnpm build
```

`pnpm build` собирает `@hh/types` и `@hh/contracts`. Без этого API падает на «Cannot find module».

Compose поднимает Postgres `5432`, Redis `6379`, Mailpit `1025` / ящик `8025`, ранжирование `8000`, мок ФСП `3001`. Креды Postgres в примере: пользователь `hh`, база `hh`.

Файл: `apps/api/.env`, копия с `.env.example`. Обязательные в примере уже стоят. Опциональные закомментированы: не заполнять нормально, API поднимется, просто не будет того, что переменная открывает.

| Переменная                | Локально                             | Если не задать                                                                         |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | `postgres://hh:hh@localhost:5432/hh` | API не стартует                                                                        |
| `REDIS_URL`               | `redis://localhost:6379`             | API не стартует                                                                        |
| `JWT_ACCESS_SECRET`       | `dev-access-secret`                  | API не стартует                                                                        |
| `JWT_REFRESH_SECRET`      | `dev-refresh-secret`                 | API не стартует                                                                        |
| `SMTP_HOST`               | `localhost`                          | API не стартует                                                                        |
| `SMTP_PORT`               | `1025` (Mailpit)                     | берётся `465`                                                                          |
| `PORT`                    | `3000`                               | `3000`                                                                                 |
| `WEB_URL`                 | `http://localhost:5173`              | то же значение; ссылки в письмах ведут не туда, если кабинет на другом порту           |
| `CORS_ORIGINS`            | можно не писать                      | `http://localhost:5173` и `:5174`                                                      |
| `FSP_URL`                 | `http://localhost:3001`              | то же                                                                                  |
| `RANKING_URL`             | `http://localhost:8000`              | то же; без сервиса подборка падает на ранжировании                                     |
| `SMTP_USER`, `SMTP_PASS`  | пусто, Mailpit без логина            | Яндекс без них письма не примет                                                        |
| `MAIL_FROM`               | можно не писать                      | берётся `SMTP_USER`                                                                    |
| `DEMO_PASSWORD`           | своё значение, в git не класть       | демо-работодатели и два демо-кандидата получают случайный пароль, вход под ними закрыт |
| `SEED_CANDIDATE_PASSWORD` | только не production                 | все сид-кандидаты со случайным паролем; в production переменная игнорируется           |

Кабинет: `VITE_API_URL` по умолчанию `http://localhost:3000`, `VITE_FSP_URL` по умолчанию `http://localhost:3001`. Пусто оставляйте.

Письма: [Mailpit](http://localhost:8025).

## Кабинет и API

```bash
pnpm --filter @hh/api dev
pnpm --filter @hh/web dev
```

Кабинет: [localhost:5173](http://localhost:5173). API: [localhost:3000](http://localhost:3000), Swagger: [localhost:3000/docs](http://localhost:3000/docs). Мок ФСП, если не из compose: `pnpm --filter @hh/mock dev` на `3001`.

Регистрация уходит письмом в Mailpit, ссылка подтверждения ведёт на `WEB_URL` (`http://localhost:5173`).

## Войти под сидом

API при старте засеивает компании и кандидатов. Чтобы войти под таблицей ниже, раскомментируйте `DEMO_PASSWORD` в `.env`. Без него аккаунты есть, пароль случайный. `SEED_CANDIDATE_PASSWORD` открывает остальных сид-кандидатов только в разработке.

| Роль         | Логин                               |
| ------------ | ----------------------------------- |
| Работодатель | `employer.parus@employers.hh.test`  |
| Работодатель | `employer.orbita@employers.hh.test` |
| Работодатель | `employer.ladoga@employers.hh.test` |
| Кандидат     | `seed.b101@candidates.hh.test`      |
| Кандидат     | `seed.f202@candidates.hh.test`      |

## Превью прод-сборки

Стенд как на сервере, рядом с dev, порты не пересекаются. Скопируйте `infra/prod/.env.example` в `.env.local` и заполните по `infra/README.md`: `DOMAIN=http://localhost`, `HTTP_PORT=8080`, мок `http://fsp-mock.localhost:8080`, почта в Mailpit через `host.docker.internal:1025`.

```bash
docker compose -p hhprod --env-file infra/prod/.env.local -f infra/prod/docker-compose.yml up -d --build
```

Кабинет: `http://localhost:8080`. Убрать: `docker compose -p hhprod -f infra/prod/docker-compose.yml down -v`.

Документация этого сайта: `cd docs/prod && npm install && npm run dev` (часто `5173`, если порт занят кабинетом, VitePress возьмёт следующий).
