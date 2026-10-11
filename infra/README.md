# infra

Окружения для запуска зависимостей и сервисов.

## `dev/`

- `docker-compose.yml` — Postgres (`5432`), Redis (`6379`), ranking (`8000`) и мок ФСП (`mock:3001`).
- `.env.example` — креды для этого compose (`POSTGRES_USER=hh`, `POSTGRES_PASSWORD=hh`, `POSTGRES_DB=hh`).

Запуск из корня:

```bash
docker compose --env-file infra/dev/.env.example -f infra/dev/docker-compose.yml up
```

`apps/api` ходит в эти сервисы по адресам из `apps/api/.env` (см. `DATABASE_URL`, `REDIS_URL`, `FSP_URL`, `RANKING_URL`).

## `prod/`

Весь стенд одной командой: postgres, redis, mock, ranking, api и web.

- `docker-compose.yml` — сервисы. Наружу открыт только `web` (Caddy, 80/443). Postgres, Redis, mock, ranking и api портов на хосте не публикуют, mock доступен снаружи только через Caddy.
- `Caddyfile` — HTTPS для `$DOMAIN`, статика SPA с фолбэком на `index.html`, `/api/*` → `api:3000` без префикса, лимит запросов на вход и регистрацию. Второй сайт — `$FSP_DOMAIN` → `mock:3001` целиком.
- `.env.example` — все переменные, секретов нет. Рабочий `.env` лежит рядом и не коммитится.

Как устроено:

- Веб и API на одном домене: бандл собран с `VITE_API_URL=/api`, CORS не нужен, код не менялся. Swagger — `https://$DOMAIN/api/docs`.
- Мок ФСП — на своём поддомене `$FSP_DOMAIN`: страница входа `https://$FSP_DOMAIN/authorize`, Swagger `https://$FSP_DOMAIN/docs`, JSON `https://$FSP_DOMAIN/docs/json`. Бандл web собран с `VITE_FSP_URL=https://$FSP_DOMAIN` (или `FSP_PUBLIC_URL`): туда кнопка «Войти через ФСП» уводит браузер. Код в обмен на ФСП ID api меняет внутри сети, по `http://mock:3001`. Смена `FSP_DOMAIN` требует пересборки web.
- `apps/web/Dockerfile` собирает статику и кладёт её в образ Caddy. Caddy собран через `xcaddy` с плагином [`caddy-ratelimit`](https://github.com/mholt/caddy-ratelimit): в стандартном Caddy лимита частоты нет. Caddyfile монтируется из `infra/prod`, его правка — без пересборки.
- Лимит: `POST /api/auth/login`, `register`, `confirm`, `confirm/resend`, `password/forgot`, `password/reset` — `AUTH_RATE_EVENTS` запросов с одного IP за `AUTH_RATE_WINDOW` (по умолчанию 10 за минуту). Сверх лимита Caddy отвечает 429 и до api запрос не доходит.
- `apps/api/Dockerfile` собирает `packages/*` и api, в рантайм идут только prod-зависимости и `dist`.
- `ranking` собирается из `apps/ranking`: сборка копирует готовую модель из `evaluation/artifacts`, без обучения.
- Письма уходят через SMTP из `.env` (Яндекс). Mailpit в проде не поднимается.
- Тома: `pgdata` (база), `redisdata` (сессии), `caddy_data` (сертификаты Let's Encrypt).
- Схема базы создаётся `synchronize: true` при старте api, миграций нет.

### Развернуть на чистом сервере

1. Docker Engine с плагином compose: `curl -fsSL https://get.docker.com | sh`. Порты 80 и 443 (TCP и UDP) открыты снаружи.
2. DNS: A-запись домена (и AAAA, если есть IPv6) на IP сервера, такая же — для поддомена мока (`FSP_DOMAIN`). Проверить: `dig +short hh.example.ru` и `dig +short fsp-mock.example.ru`. Без этого Caddy не получит сертификат.
3. Код и `.env`:

   ```bash
   git clone https://github.com/DjonniStorm/hh-but-it-works.git && cd hh-but-it-works
   git checkout dev
   cp infra/prod/.env.example infra/prod/.env
   ```

   Заполнить `DOMAIN`, `FSP_DOMAIN`, `ACME_EMAIL`, `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (`openssl rand -hex 32`), `SMTP_USER`, `SMTP_PASS`. `chmod 600 infra/prod/.env`.

4. Запуск (первая сборка — несколько минут):

   ```bash
   docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml up -d --build
   ```

Дальше в командах `dc` — это `docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml`.

### Проверить

```bash
dc ps                                   # все сервисы healthy
curl -s https://hh.example.ru/api/health  # {"status":"ok"}
curl -s https://fsp-mock.example.ru/health  # мок ФСП
dc logs web | grep -i certificate       # сертификат получен
dc logs -f api
```

В браузере: главная открывается, регистрация присылает письмо, ссылка из него подтверждает почту, работодатель видит подборку, «Войти через ФСП» в профиле кандидата открывает страницу мока и после входа возвращает в профиль.

### Обновить

```bash
git pull
dc up -d --build
```

Пересобираются только изменённые образы. Данные в томах остаются. Правка одного `Caddyfile`: `dc exec web caddy reload --config /etc/caddy/Caddyfile`.

### Бэкап и восстановление базы

```bash
dc exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > hh-$(date +%F).dump
dc exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < hh-2026-10-11.dump
```

`dc down` тома не трогает. `dc down -v` удаляет базу и сертификаты.

### Проверить локально

Стенд можно поднять рядом с `dev`, не задевая его порты:

```bash
docker compose -p hhprod --env-file infra/prod/.env.local -f infra/prod/docker-compose.yml up -d --build
```

В `.env.local`: `DOMAIN=http://localhost` (только HTTP, без сертификата), `FSP_DOMAIN=http://fsp-mock.localhost`, `FSP_PUBLIC_URL=http://fsp-mock.localhost:8080` (`*.localhost` браузер сам ведёт на 127.0.0.1), `HTTP_PORT=8080`, `HTTPS_PORT=8443`, `WEB_URL=http://localhost:8080`. Почта — в Mailpit из `infra/dev`: `SMTP_HOST=host.docker.internal`, `SMTP_PORT=1025`. Для входа под сид-кандидатами — `NODE_ENV=development` и `SEED_CANDIDATE_PASSWORD`. Убрать: `docker compose -p hhprod -f infra/prod/docker-compose.yml down -v`.

## Демо-аккаунты

API при старте засеивает 15 компаний с потребностями (`employers/employer-seed.data.ts`) и 21 кандидата. Войти можно только под пятью аккаунтами, и только если в `.env` задан `DEMO_PASSWORD` (в production тоже). Без него у них случайный пароль. Пароль в репозиторий не пишем.

| Роль         | Логин                               | Что внутри                              |
| ------------ | ----------------------------------- | --------------------------------------- |
| Работодатель | `employer.parus@employers.hh.test`  | Парус Финтех: backend и безопасность    |
| Работодатель | `employer.orbita@employers.hh.test` | Медиа Орбита: два frontend              |
| Работодатель | `employer.ladoga@employers.hh.test` | Ладога Аналитика: два data              |
| Кандидат     | `seed.b101@candidates.hh.test`      | backend, Middle, подтверждённые навыки  |
| Кандидат     | `seed.f202@candidates.hh.test`      | frontend, Senior, подтверждённые навыки |

На проде: `DEMO_PASSWORD=…` в `/opt/hh/infra/prod/.env`, затем `dc up -d --build api` (`dc` — команда из раздела про прод, с `--env-file infra/prod/.env`). Убрать значение и пересоздать api значит закрыть вход.

## Ranking

Контейнер собирается из корня:

```bash
docker build -t hh-ranking-test apps/ranking
docker run -p 8000:8000 hh-ranking-test
curl -s localhost:8000/health
```

Модель уже обучена и лежит в `apps/ranking/evaluation/artifacts/ltr-v1.5.0-llm`.
Docker build только копирует model/metadata/calibrator/report в минимальный runtime:
scikit-learn и обучение ему не нужны. Workflow `ranking-image.yml` публикует
готовые `amd64`/`arm64` образы в
`ghcr.io/djonnistorm/hh-but-it-works-ranking` с тегами `dev`, `main`, git SHA и
release tag. `docker-compose.yml` использует готовый образ, если он доступен.

Артефакт по умолчанию — llm-approved `ltr-v1.5.0-llm`: `/health` показывает
`productionApproved=true` без override-переменных. Human-approved артефакт —
следующий tier после двойной human-разметки; `RANKING_ALLOW_UNAPPROVED_MODEL`
остаётся только debugging-инструментом.
