[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=402FFF&width=435&lines=hh+but+it+works)](https://git.io/typing-svg)

Платформа поиска работы, специальный трек Федерации спортивного программирования (ЛЦТ). Команда «Да какая разница какое название».

| Что                         | Куда                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Стенд                       | [hire.eegov.net](https://hire.eegov.net)                                                                                                       |
| Мок ФСП                     | [fsp-mock.eegov.net](https://fsp-mock.eegov.net)                                                                                               |
| Публичная документация      | [`docs/prod`](docs/prod): как работает, стек, ФСП, антисписывание, код, дорожная карта. Локально: `cd docs/prod && npm install && npm run dev` |
| Как поднять у себя          | [docs/prod/site/how/local.md](docs/prod/site/how/local.md)                                                                                     |
| Писать код                  | [AGENTS.md](AGENTS.md), [docs/dev/AGENT_HANDOFF.md](docs/dev/AGENT_HANDOFF.md)                                                                 |
| Вся внутренняя документация | [docs/README.md](docs/README.md)                                                                                                               |

## Быстрый старт

```bash
pnpm install
pnpm build
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
cp apps/api/.env.example apps/api/.env

pnpm --filter @hh/api dev    # :3000, Swagger /docs
pnpm --filter @hh/web dev    # :5173
```

`pnpm build` собирает `@hh/types` и `@hh/contracts`. Без этого API не стартует.

Compose поднимает Postgres, Redis, Mailpit (ящик [localhost:8025](http://localhost:8025)), ранжирование (`:8000`) и мок ФСП (`:3001`). Мок с хоста, если не из compose: `pnpm --filter @hh/mock dev`.

`docker compose` собирает `ranking` из этой копии (GHCR-тег `:dev` отстаёт, CI выключен).

Письма регистрации и сброса пароля идут в Mailpit, ссылка подтверждения на `WEB_URL` (`http://localhost:5173`). Чтобы войти под сидом, раскомментируйте `DEMO_PASSWORD` в `apps/api/.env`. Список логинов: [local.md](docs/prod/site/how/local.md).

Проверки ML-части (Python 3.12): `sh apps/ranking/scripts/check.sh`, окружение в [apps/ranking/README.md](apps/ranking/README.md).

## Структура

- `apps/web` — кабинеты кандидата и работодателя (Vite, React, Mantine, MobX).
- `apps/api` — Nest, Postgres, Redis. Состояние системы живёт здесь.
- `apps/ranking` — ранжирование пар «вакансия × кандидат», FastAPI, без БД, `POST /rank`.
- `apps/mock` — мок реестра ФСП.
- `packages/` — `types`, `contracts`, `assessment-engine`.
- `docs/prod` — публичный VitePress, на Vercel Root Directory = `docs/prod`.
- `docs/dev` — архитектура, модель, тесты, хэндофф для разработки.
- `infra/` — compose для dev и стенда.
