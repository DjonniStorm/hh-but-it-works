# Брифинг для агентов и инженеров

Инструкция для того, кто берётся дорабатывать этот репозиторий: контекст системы, правила, команды, подводные камни. Прочитать до первой правки кода.

Конвенции кода и стили — [`AGENTS.md`](../../AGENTS.md) в корне, это обязательное чтение. Здесь — системный контекст и рабочий порядок.

---

## 1. Что за система

Маркетплейс работы с верифицированными кандидатами: кандидат заполняет профиль, проходит технологические тесты, работодатель заводит потребность и видит подборку с объяснением «почему этот кандидат подходит».

Ключевой принцип продукта — **verified talent matching**: подтверждённый навык или грейд весит больше заявленного. Это реализовано в формулах `apps/ranking/scoring.py`, а не в UI.

```text
web (React)  →  api (Nest)  →  postgres / redis
                              →  mock   (реестр ФСП, :3001)
                              →  ranking (скоринг, :8000)
```

Правила:

- `ranking` и `mock` — stateless-сервисы без БД и без auth. Всё состояние — в Nest/Postgres.
- Новых сервисов, БД и Nest-модулей не заводить без согласования (см. `AGENTS.md`).
- LLM в горячем пути быть не должно; FSP — вспомогательный сигнал, не фильтр.
- Контракт — `@hh/contracts`. Внешние API не ломать: изменение = Zod-схема + DTO + `pnpm openapi`.

## 2. Точка входа по задачам

| Задача                               | Читать первым                                                      |
| ------------------------------------ | ------------------------------------------------------------------ |
| Правки скоринга/весов/причин         | `apps/ranking/HANDOFF.md` §3, `scoring.py`, затем §7.2 этого файла |
| Формат запросов/ответов `/rank`      | `apps/ranking/INTEGRATION.md`, `apps/api/.../ranking.client.ts`    |
| Контракт API, новая/изменённая ручка | `packages/contracts/README.md`, `AGENTS.md` «Клиент API»           |
| Кабинеты, сторы, формы               | `AGENTS.md` «Сторы», «Формы»; `apps/web/README.md`                 |
| Тесты (assessments)                  | `docs/dev/testing-validation.md`                                   |
| Инфраструктура, окружение            | `infra/README.md`                                                  |
| Схема и доменные типы                | `docs/dev/architecture.md`, `docs/dev/model.md`                    |

## 3. Порядок работы

```bash
# 1. зависимости
pnpm install

# 2. инфраструктура
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up

# 3. env
cp apps/api/.env.example apps/api/.env

# 4. ветка от dev
git checkout dev && git pull && git checkout -b feature/<тема>

# 5. запуск
pnpm --filter @hh/api dev     # :3000
pnpm --filter @hh/web dev     # :5173
pnpm --filter @hh/mock dev    # :3001 (или через compose)

# 6. проверки перед коммитом
pnpm build
pnpm test                                   # API contract + web reason-label tests ML-границы
pnpm exec eslint --max-warnings 0 .
pnpm exec prettier --check --ignore-unknown .
sh apps/ranking/scripts/check.sh            # ML-часть (нужен Python 3.12)
```

Ветка всегда от `dev` (`feature/**`, `fix/**`). Ревью: в `dev` — по желанию, в `master` — обязательно. PR открывать **в `dev`**, шаблон — `.github/PULL_REQUEST_TEMPLATE.md`.

## 4. Подводные камни

- **Python нужен 3.12.** Системный 3.9 падает на `str | None` в pydantic-аннотациях. Венв создавать **вне** `apps/ranking` — иначе `check.sh` начнёт компилировать его содержимое.
- **`pnpm-lock.yaml` дёргается** при каждом `pnpm install`/`pnpm exec` (pnpm 12 дописывает `@pnpm/exe` в `packageManagerDependencies`). В коммит не тащить: `git checkout pnpm-lock.yaml`.
- **`pnpm test` покрывает только ML-границу.** Он собирает Nest, запускает пять contract tests адаптера/verified-pool/`shortlist` и три unit tests web mapping/reason labels; остальной Nest и React-компоненты не покрыты.
- **`apps/web/src/shared/api/generated/` не править руками** — только `pnpm openapi`.
- **Скор по контракту — проценты 0..100**, модель отдаёт 0..1. Перевод — `toHundred` в `ranking.client.ts`. Если начнут «дублироваться» оценки, смотри туда.
- **Контракт и схема `/rank` различаются намеренно** (имена полей, шкала, набор полей). Всё сведение — в адаптере, не «исправлять» по одному из концов.
- **Новые коды причин** (`reasons`/`warnings`/`rejectedBy`) требуют пункта в `apps/web/src/shared/lib/labels.ts#reasonText`.
- **Типы `@hh/types` собираются в CJS** — в Vite на него есть алиас на исходники; не убирать.
- **Данные `apps/mock` и сид кандидатов** (`candidate-seed.data.ts`) должны совпадать: `fspId = "fsp-" + код`.
- **Docker-демон нужен запущенный** (на macOS — OrbStack). Без него `docker build` просто не стартует.
- `apps/ranking/model.txt`, `model.meta.json`, `calibrator.json`, `.pytest_cache`, `__pycache__` — в `.gitignore`, не коммитить.

## 5. Известные пробелы (не багать, но знать)

1. В Nest есть contract tests для `ranking.client.ts` и `shortlist`, в web — тесты reason labels; остальная бизнес-логика и React-компоненты не покрыты.
2. CI покрывает ranking image и artifact verification; общего monorepo CI пока нет.
3. `apps/ranking` — полное описание состояния в [`apps/ranking/HANDOFF.md`](../../apps/ranking/HANDOFF.md): что сделано, что не подключено к контракту (semantic, персонализация, freshness), что дальше.
4. Ranking поддерживает rules/shadow/hybrid/LTR. Готовый versioned artifact хранится в репозитории; Docker не обучает, а копирует его и запускает demo hybrid с явным unapproved override. `ranking-image.yml` публикует multi-arch GHCR image, `scripts/promote_ml.sh` создаёт новую версию, `verify_artifacts.sh` проверяет checksum/held-out gate. Настоящий production artifact требует двойную human-разметку.
5. `infra/prod` пуст.

## 6. Что не делать

- Не добавлять в `apps/ranking` БД, Redis, очереди, HTTP в `score_pair`, LLM в горячем пути.
- Не разделять `master` и `dev` местами, не мержить в `master` самому.
- Не писать секреты и пароли в репозиторий; всё чувствительное — в `.env`, который не коммитится.
- Не менять `git config`, не форс-пушить, не амендить чужие коммиты.
- Не оставлять «заглушку вместо данных» (`modelVersion = "ranking-stub"` — так уже было, это считается дефектом).
