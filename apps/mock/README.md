# mock

Мок реестра ФСП на Bun и Elysia. Две ручки с участником в ответе:

- `GET /participants/:fspId` — участник по идентификатору, `404`, если истории нет;
- `GET /participants/by-email/:email` — участник по почте (импорт при регистрации), `404`, если почты нет в реестре.

Известные id: `fsp-demo`, `fsp-b101`, `fsp-b103`, … Плюс тестовые участники без пары в сиде: `fsp-test` (`seed.test@candidates.hh.test`), `fsp-test2` (`seed.test2@…`, иной разряд и рейтинг) и `fsp-test3` (`seed.test3@…`, без разряда, рейтинга и достижений — кейс «истории нет»). Остальные почты — `seed.<код>@candidates.hh.test`.

Swagger UI: `http://localhost:3001/docs`, спецификация — `/docs/json`. Её собирает `@elysiajs/openapi` из схем `t.Object` на ручках: новая ручка или поле — схема в `response`, иначе в Swagger его не будет.

```bash
pnpm --filter @hh/mock dev     # bun --watch src/index.ts
pnpm --filter @hh/mock start
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up   # сервис `mock`, порт 3001
```

## Важное правило

Люди и соревнования совпадают с сидом кандидатов в API: `apps/api/src/modules/profiles/candidate-seed.data.ts`. `fspId` сид-кандидата — `"fsp-" + его код` (`fsp-b101`, `fsp-b103`, …), почта — `seed.<код>@candidates.hh.test`. Сид задаёт, какие соревнования есть (`title`/`year`/`place` — их же ждём в моке) и стоит ли `fspId` в анкете. Детали (`kind`, `level`, `organizer`), отдельные грамоты и сертификаты, разряды и рейтинг — домен мока: в сиде их нет, источник истины по ним — мок.

## Как его используют

`FspClient` в `apps/api/src/common/fsp/fsp.client.ts` зовёт мок: подборка — по `fspId` на каждого кандидата, импорт ФСП — по почте кандидата. Таймаут 2 с, кэш в Redis на час. `404` и недоступный реестр превращаются в пустой список — **подборка не должна падать из-за реестра ФСП**. Для поиска по почте статусы различаются: `not-found` (в реестре нет) и `unavailable` (реестр молчит) — при сбое врать «истории нет» нельзя.

Достижения уходят в `RankingClient` как `fspEvidence`, а из него — в небольшой бонус `components.fspEvidence`. FSP никогда не является жёстким фильтром: отсутствие истории нейтрально (см. `test_fsp_absence_is_neutral_not_gate`).
