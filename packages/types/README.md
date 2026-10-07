# `@hh/types`

Enum'ы и доменные типы без логики. Собирается в CJS (`tsc -p tsconfig.json`), `main: dist/index.js`.

Что здесь: `Role`, `Grade`, `SkillVerification`, `SearchStatus`, `SkillLevel`, `MatchGroup`, `AttemptGrade` и близкие типы, которые используют и API, и веб.

Правила:

- enum живёт здесь один раз; дублировать строковые литералы в `web` и `api` нельзя.
- Vite не импортирует CJS-enum как named export, поэтому в `apps/web/vite.config.ts` алиас `@hh/types` смотрит на исходники пакета.
- Пакет не зависит ни от Nest, ни от React, ни от FastAPI.

Изменение enum'а = пересборка всех потребителей (`pnpm build` в корне) и ручная проверка веток `switch`/`Record` — TypeScript поймает неполноту только там, где тип union exhaustive.
