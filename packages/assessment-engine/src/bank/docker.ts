import { Grade } from "@hh/types";

import { between, pick, sample } from "../random";
import type { Template } from "../types";

const { Junior, Middle, Senior } = Grade;

export const docker: Template[] = [
  {
    id: "dk-port",
    topic: "ports",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const port = 3000 + between(rng, 0, 99);
      return {
        kind: "single",
        prompt: `Процесс в контейнере слушает ${port}. Какой флаг опубликует порт на хосте под тем же номером?`,
        correct: `-p ${port}:${port}`,
        wrong: [`--expose ${port}`, `--port ${port}`, `-e PORT=${port}`],
      };
    },
  },
  {
    id: "dk-ps-all",
    topic: "cli",
    grades: [Junior],
    difficulty: 1,
    build: () => {
      return {
        kind: "single",
        prompt: "Какая команда покажет и остановленные контейнеры?",
        correct: "docker ps -a",
        wrong: ["docker ps", "docker images", "docker logs"],
      };
    },
  },
  {
    id: "dk-env",
    topic: "config",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const key = pick(rng, ["NODE_ENV", "LOG_LEVEL", "API_URL"]);
      return {
        kind: "single",
        prompt: `Как передать ${key} в контейнер при запуске?`,
        correct: `-e ${key}=value`,
        wrong: [`-v ${key}=value`, `-p ${key}=value`, `--label ${key}=value`],
      };
    },
  },
  {
    id: "dk-named-volume",
    topic: "volumes",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      const volume = pick(rng, ["pgdata", "uploads", "cache"]);
      return {
        kind: "single",
        prompt: `Контейнер с именованным томом ${volume} удалили через docker rm. Что будет с данными тома?`,
        correct: "Сохранятся",
        wrong: [
          "Удалятся вместе с контейнером",
          "Перейдут в образ",
          "Станут только для чтения",
        ],
      };
    },
  },
  {
    id: "dk-memory",
    topic: "resources",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const memory = pick(rng, [128, 256, 512, 768]);
      return {
        kind: "single",
        prompt: `Контейнеру можно не больше ${memory} мегабайт памяти. Какой флаг это задаёт?`,
        correct: `--memory ${memory}m`,
        wrong: [`--cpus ${memory}`, `-m ${memory}g`, `--memory-swap ${memory}`],
      };
    },
  },
  {
    id: "dk-run-layers",
    topic: "layers",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const layers = between(rng, 2, 7);
      return {
        kind: "numeric",
        prompt: `В Dockerfile ${layers} отдельных инструкций RUN, они не объединены через &&. Сколько слоёв от RUN будет в образе?`,
        answer: layers,
      };
    },
  },
  {
    id: "dk-cache-order",
    topic: "layers",
    grades: [Middle, Senior],
    difficulty: 3,
    build: () => {
      return {
        kind: "order",
        prompt:
          "Расставьте инструкции Dockerfile для Node так, чтобы правка кода не сбрасывала кэш зависимостей.",
        steps: [
          "FROM node:22-alpine",
          "WORKDIR /app",
          "COPY package*.json ./",
          "RUN npm ci",
          "COPY . .",
        ],
      };
    },
  },
  {
    id: "dk-network-name",
    topic: "networking",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const name = pick(rng, ["db", "postgres", "store"]);
      return {
        kind: "single",
        prompt: `api и база в одной пользовательской сети Docker. Как api обратится к базе в контейнере ${name}?`,
        correct: `${name}:5432`,
        wrong: ["localhost:5432", "127.0.0.1:5432", "0.0.0.0:5432"],
      };
    },
  },
  {
    id: "dk-entrypoint-cmd",
    topic: "images",
    grades: [Middle, Senior],
    difficulty: 3,
    build: (rng) => {
      const [base, fallback, argument] = sample(
        rng,
        ["hi", "ok", "go", "run", "up"],
        3,
      );
      return {
        kind: "code",
        prompt: `Что выведет docker run img ${argument}?`,
        code: `FROM alpine\nENTRYPOINT ["echo", "${base}"]\nCMD ["${fallback}"]`,
        correct: `${base} ${argument}`,
        wrong: [
          `${base} ${fallback}`,
          argument ?? "",
          `${base} ${fallback} ${argument}`,
        ],
      };
    },
  },
  {
    id: "dk-multistage",
    topic: "images",
    grades: [Senior],
    difficulty: 2,
    build: () => {
      return {
        kind: "single",
        prompt: "Зачем нужна multi-stage сборка?",
        correct:
          "В финальный образ попадает только результат сборки, без компиляторов и dev-зависимостей",
        wrong: [
          "Контейнер запускается в нескольких процессах",
          "Сборка идёт сразу на нескольких хостах",
          "Образ подписывается для реестра",
        ],
      };
    },
  },
  {
    id: "dk-hardening",
    topic: "security",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Что снижает ущерб, если контейнер взломают?",
        correct: sample(
          rng,
          [
            "USER с непривилегированным пользователем",
            "Файловая система только для чтения (--read-only)",
            "Сбросить лишние capabilities (--cap-drop)",
          ],
          between(rng, 2, 3),
        ),
        wrong: ["Запуск с --privileged", "Смонтировать /var/run/docker.sock"],
      };
    },
  },
];
