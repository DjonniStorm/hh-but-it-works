# apps

Четыре приложения pnpm workspace. Архитектура целиком: [docs/dev/architecture.md](../docs/dev/architecture.md).

```text
web  ──HTTP/JSON──>  api  ──SQL──> postgres
 │                    │  └─cache──> redis (BullMQ, refresh, токены)
 │                    ├──HTTP──> mock   (реестр ФСП, :3001)
 │                    └──HTTP──> ranking (:8000, скоринг пар)
 └── openapi-ts генерирует клиент из api/openapi.json
```

| Приложение | Стек                                          | Порт | Что делает                                                      |
| ---------- | --------------------------------------------- | ---- | --------------------------------------------------------------- |
| `web`      | Vite, React 19, Mantine 9, MobX, react-router | 5173 | Кабинеты кандидата и работодателя                               |
| `api`      | Nest 11, TypeORM, Postgres, Redis, BullMQ     | 3000 | Единственный источник данных, auth, оценки, подборки            |
| `mock`     | Bun + Elysia                                  | 3001 | Фейковый реестр достижений ФСП, нужен для `fspEvidence`         |
| `ranking`  | FastAPI + Pydantic                            | 8000 | Детерминированный скоринг «вакансия × кандидат», career analyze |

`ranking` и `mock` не хранят состояние и к auth отношения не имеют. В production `ranking` крутится в Docker, `mock` не разворачивается.

Подробности и команды — в `README.md` внутри каждого приложения.
