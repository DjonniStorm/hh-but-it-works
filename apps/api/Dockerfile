# Собирается из корня репозитория: docker build -f apps/api/Dockerfile .
# Сначала packages/* (types → contracts, assessment-engine), потом сам api.
# В рантайм идут только prod-зависимости и dist.

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
# Только манифесты: слой с зависимостями не пересобирается от правок кода.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/contracts/package.json packages/contracts/
COPY packages/assessment-engine/package.json packages/assessment-engine/
COPY apps/api/package.json apps/api/

FROM base AS build
# Без скриптов: корневой prepare ставит git-хуки lefthook, а git в образе нет.
# bcrypt берёт готовый бинарник из своих prebuilds, компилировать не нужно.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter "@hh/api..."
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter "./packages/*" build && pnpm --filter @hh/api build

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prod --filter "@hh/api..."

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app ./
# Пакеты воркспейса подключены симлинками из node_modules, им нужен свой dist.
COPY --from=build /app/packages/types/dist packages/types/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/assessment-engine/dist packages/assessment-engine/dist
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/main"]
