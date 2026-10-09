# mock

Мок реестра ФСП на Bun и Elysia. `GET /participants/:fspId` отдаёт достижения. Если истории нет — `404`. Известный id для проверки: `fsp-demo`.

Swagger UI: `http://localhost:3001/docs`, спецификация — `/docs/json`. Её собирает `@elysiajs/openapi` из схем `t.Object` на ручках: новая ручка или поле — схема в `response`, иначе в Swagger его не будет.

```bash
pnpm --filter @hh/mock dev     # bun --watch src/index.ts
pnpm --filter @hh/mock start
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up   # сервис `mock`, порт 3001
```

## Важное правило

Данные участников должны совпадать с сидом кандидатов в API: `apps/api/src/modules/profiles/candidate-seed.data.ts`. `fspId` сид-кандидата — `"fsp-" + его код` (`fsp-b101`, `fsp-b103`, …). Изменяешь одно — правь и второе.

## Как его используют

`FspClient` в `apps/api/src/modules/employers/fsp.client.ts` зовёт мок на каждого кандидата подборки: таймаут 2 с, кэш в Redis на час. `404` и недоступный реестр превращаются в пустой список — **подборка не должна падать из-за реестра ФСП**.

Достижения уходят в `RankingClient` как `fspEvidence`, а из него — в небольшой бонус `components.fspEvidence`. FSP никогда не является жёстким фильтром: отсутствие истории нейтрально (см. `test_fsp_absence_is_neutral_not_gate`).
