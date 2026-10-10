# packages

Общие пакеты, которые тянут и API, и веб. Собираются `pnpm -r --filter "./packages/*" build` (входит в корневой `pnpm build`).

| Пакет                   | Назначение                                                                                             | Импортят            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| `@hh/types`             | Enum'ы, доменные типы и каталог навыков (`skillCatalog`): `Role`, `Grade`, `SkillVerification` и т. д. | api, web, contracts |
| `@hh/contracts`         | Zod-схемы запросов/ответов и группировки `MatchBreakdown` — это и есть контракт «что ест API»          | api, web            |
| `@hh/assessment-engine` | Ядро тестов: сборка попытки, чек ответов, grade, integrity, банк заданий                               | api                 |

Важно: `@hh/types` собирается в CJS, Vite не умеет брать из него enum как named export. Поэтому в `apps/web/vite.config.ts` есть алиасы `@hh/types` и `@hh/contracts` на исходники.

Договоры между слоями:

- новая/изменённая ручка = правка Zod-схемы в `contracts` + DTO в API, потом `pnpm openapi`;
- новые enum'ы = `types`, без дублирования строк в `web`;
- ни один пакет не знает про Nest, React и FastAPI — это общие типы и чистая логика.

Документация движка оценок: [docs/dev/testing-validation.md](../docs/dev/testing-validation.md).
