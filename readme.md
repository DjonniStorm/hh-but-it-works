[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=402FFF&width=435&lines=hh+but+it+works)](https://git.io/typing-svg)

## Быстрый старт

```bash
pnpm install
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
cp apps/api/.env.example apps/api/.env

pnpm --filter @hh/api dev    # :3000
pnpm --filter @hh/web dev    # :5173
```

Рекомендательная система (FastAPI, `:8000`):

```bash
sh apps/ranking/scripts/check.sh    # все проверки ML-части
```

## Документация

| Документ                                                         | Что внутри                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| [docs/README.md](docs/README.md)                                 | индекс всей документации                                      |
| [docs/dev/architecture.md](docs/dev/architecture.md)             | схема сервисов и потоки данных                                |
| [docs/dev/model.md](docs/dev/model.md)                           | доменная модель                                               |
| [docs/dev/AGENT_HANDOFF.md](docs/dev/AGENT_HANDOFF.md)           | брифинг для инженеров и агентов: контекст, правила, команды   |
| [docs/dev/testing-validation.md](docs/dev/testing-validation.md) | тесты кандидатов: сборка, защита, валидация                   |
| [AGENTS.md](AGENTS.md)                                           | конвенции кода и правила репозитория                          |
| [apps/README.md](apps/README.md)                                 | карта приложений                                              |
| [apps/ranking/HANDOFF.md](apps/ranking/HANDOFF.md)               | что уже сделано по рекомендательной системе: анализ и хэндофф |

## Структура

- `apps/web` — кабинеты кандидата и работодателя (Vite, React, Mantine, MobX).
- `apps/api` — Nest, Postgres, Redis, единый источник данных.
- `apps/ranking` — детерминированный скоринг «вакансия × кандидат» и career analyze (FastAPI, без БД).
- `apps/mock` — мок реестра ФСП.
- `packages/` — `types`, `contracts`, `assessment-engine`.
- `docs/`, `infra/` — документация и окружения.
