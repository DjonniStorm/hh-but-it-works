FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./src

EXPOSE 3001
CMD ["bun", "src/index.ts"]
