# api

HTTP API на NestJS.

Логики пока нет. Postgres и Redis для локальной разработки:

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
```

Команды запускаются из корня репозитория. Скопируйте `apps/api/.env.example` в `apps/api/.env`, затем:

```bash
pnpm --filter @hh/api dev
```
