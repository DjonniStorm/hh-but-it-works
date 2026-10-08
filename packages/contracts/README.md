# `@hh/contracts`

Zod-схемы запросов и ответов — это и есть контракт «что ест API». Объекты экспортируются типами, их же валидирует Nest через `nestjs-zod`, их же парсит веб.

Ключевое для рекомендательной системы — группы разбивки:

```ts
MatchBreakdown / MatchGroup; // category, skills, assessment, fsp, preferences
```

Они используются в `apps/api/src/modules/employers/ranking.client.ts` (формирование `breakdown`), в `apps/web/src/pages/employer/ui/WhyMatch.tsx` и `BreakdownGroup.tsx`.

## Как менять контракт

1. Поправить схему здесь и DTO в API.
2. `pnpm openapi` — соберёт пакет, запишет `apps/api/openapi.json`, прогонит `@hey-api/openapi-ts` (конфиг `openapi-ts.config.ts`).
3. Сгенерированный клиент `apps/web/src/shared/api/generated` не править руками.
4. Маппинг в доменные типы веба — `apps/web/src/shared/api/map-*.ts`.
5. Если меняется формат `/rank` — заодно обновить `ranking.client.ts` и `apps/ranking/INTEGRATION.md`.

Важно: контракт подборки и схема ранжирователя **намеренно разные** (разные имена полей, разная шкала, разный набор полей). Роль посредника — `ranking.client.ts`. Не «сближай» их без решения: это ломает внешний API и документированный контракт сервиса.
