# Собирается из корня репозитория: docker build -f apps/web/Dockerfile .
# Итог — Caddy со статикой SPA. Caddyfile в образ не кладём, его монтирует
# infra/prod/docker-compose.yml.

# В стандартном Caddy нет лимита частоты запросов, собираем с плагином.
FROM caddy:2.10-builder AS caddy
ARG CADDY_RATELIMIT_VERSION=v0.1.0
RUN xcaddy build --with github.com/mholt/caddy-ratelimit@${CADDY_RATELIMIT_VERSION}

FROM node:24-bookworm-slim AS build
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/
# Без скриптов: корневой prepare ставит git-хуки lefthook, а git в образе нет.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter "@hh/web..."
COPY packages/types ./packages/types
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
# Адрес API вшивается в бандл при сборке. "/api" — тот же домен,
# Caddy снимает префикс и проксирует в контейнер api.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter "./packages/*" build && pnpm --filter @hh/web build

FROM caddy:2.10-alpine
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=build /app/apps/web/dist /srv
