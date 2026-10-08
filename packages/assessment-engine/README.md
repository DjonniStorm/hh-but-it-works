# `@hh/assessment-engine`

Чистая TypeScript-логика тестов. Ни Nest, ни HTTP, ни БД — движок не знает, откуда пришли данные. `pnpm --filter @hh/assessment-engine build`.

## Файлы

| Файл           | Что делает                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `attempt.ts`   | `buildAttempt` (сборка попытки), `checkAnswer`, `gradeAttempt`, пороги секции/попытки, `confidentScore`                       |
| `bank/`        | Банк заданий: `typescript`, `postgresql`, `http-api`, `docker`, `testing` + `index.ts` (`bank`, `catalogSlugs`, `coreSkills`) |
| `need.ts`      | `planForNeed` / `slugForSkill` — перевод навыков вакансии в секции банка, `uncovered` — что проверить нечем                   |
| `integrity.ts` | Флаги списывания, `integrityScore`, `annulBelow`, `isAnnulled`                                                                |
| `random.ts`    | Детерминированный RNG от seed попытки                                                                                         |
| `types.ts`     | `Task`, `Template`, `PublicItem`, `SecretItem`, `AttemptGrade`                                                                |

## Команды

```bash
pnpm --filter @hh/assessment-engine build
pnpm --filter @hh/assessment-engine validate        # валидация на синтетических кандидатах (PER_SECTION=6)
pnpm --filter @hh/assessment-engine vacancy-demo    # сборка плана из вакансии, примеры и пробелы банка
```

## Связь с рекомендациями

`assessmentScore` из этой движка и верификация навыков (`verified`/`verificationState`) — вход для `apps/ranking`: входят в `qualificationScore` (вес 0,09) и в `verifiedMustSkills` (0,09). Чем выше проверенность навыка, тем больше вес — это центральное правило «verified talent matching».

Полный разбор: [docs/dev/testing-validation.md](../../docs/dev/testing-validation.md).
