import { Grade } from "@hh/types";

import { between, pick, sample } from "../random";
import type { Template } from "../types";

const { Junior, Middle, Senior } = Grade;

const resources = ["заказ", "платёж", "пользователь", "заявка", "отзыв"];

export const httpApi: Template[] = [
  {
    id: "http-created",
    topic: "status",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      return {
        kind: "single",
        prompt: `POST /api создал ресурс «${pick(rng, resources)}». Какой статус уместен?`,
        correct: "201",
        wrong: ["200", "204", "302"],
      };
    },
  },
  {
    id: "http-not-found",
    topic: "status",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      const id = between(rng, 100, 999);
      return {
        kind: "single",
        prompt: `Клиент запросил GET /users/${id}, такого пользователя нет. Какой статус вернуть?`,
        correct: "404",
        wrong: ["400", "500", "204"],
      };
    },
  },
  {
    id: "http-rate-limit",
    topic: "status",
    grades: [Middle],
    difficulty: 1,
    build: (rng) => {
      const limit = 10 * between(rng, 3, 30);
      return {
        kind: "single",
        prompt: `Лимит ${limit} запросов в минуту, клиент отправил больше. Какой статус вернуть?`,
        correct: "429",
        wrong: ["403", "503", "400"],
      };
    },
  },
  {
    id: "http-safe-methods",
    topic: "methods",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt:
          "Какие методы по стандарту безопасные, то есть не меняют состояние сервера?",
        correct: sample(rng, ["GET", "HEAD", "OPTIONS"], between(rng, 2, 3)),
        wrong: sample(rng, ["POST", "PUT", "PATCH", "DELETE"], 2),
      };
    },
  },
  {
    id: "http-idempotent-methods",
    topic: "methods",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие методы идемпотентны по RFC 9110?",
        correct: sample(rng, ["GET", "PUT", "DELETE"], between(rng, 2, 3)),
        wrong: ["POST", "PATCH"],
      };
    },
  },
  {
    id: "http-page-offset",
    topic: "pagination",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const page = between(rng, 2, 9);
      const size = pick(rng, [10, 20, 25, 50]);
      return {
        kind: "numeric",
        prompt: `GET /items?page=${page}&size=${size}, страницы считаются с 1. Какой OFFSET уйдёт в базу?`,
        answer: (page - 1) * size,
      };
    },
  },
  {
    id: "http-cursor",
    topic: "pagination",
    grades: [Senior],
    difficulty: 3,
    build: () => {
      return {
        kind: "single",
        prompt:
          "В ленту постоянно добавляют записи. Чем курсорная пагинация лучше offset?",
        correct:
          "Новые записи не сдвигают страницы, поэтому нет дублей и пропусков",
        wrong: [
          "Курсору не нужен индекс",
          "Можно сразу открыть страницу с любым номером",
          "Ответ всегда меньше по размеру",
        ],
      };
    },
  },
  {
    id: "http-idempotency-key",
    topic: "idempotency",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      const retries = between(rng, 2, 6);
      return {
        kind: "numeric",
        prompt: `Клиент отправил POST ${retries} раз с одним Idempotency-Key. Сервер хранит ответ первого вызова по ключу. Сколько ресурсов создастся?`,
        answer: 1,
      };
    },
  },
  {
    id: "http-idempotency-flow",
    topic: "idempotency",
    grades: [Senior],
    difficulty: 3,
    build: () => {
      return {
        kind: "order",
        prompt: "Расставьте шаги обработки POST с Idempotency-Key на сервере.",
        steps: [
          "Прочитать ключ из заголовка",
          "Поискать сохранённый ответ по ключу",
          "Ответ нашёлся — вернуть его без повторной операции",
          "Ответа нет — выполнить операцию",
          "Сохранить ответ под этим ключом",
        ],
      };
    },
  },
  {
    id: "http-etag",
    topic: "caching",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const tag = Math.floor(rng() * 0xffffff).toString(16);
      return {
        kind: "single",
        prompt: `Клиент шлёт If-None-Match: "${tag}", и ETag ресурса не изменился. Что ответит сервер?`,
        correct: "304 Not Modified без тела",
        wrong: [
          "200 с полным телом",
          "412 Precondition Failed",
          "409 Conflict",
        ],
      };
    },
  },
  {
    id: "http-no-store",
    topic: "caching",
    grades: [Junior, Middle],
    difficulty: 1,
    build: () => {
      return {
        kind: "single",
        prompt: "Какой заголовок запрещает сохранять ответ в любом кэше?",
        correct: "Cache-Control: no-store",
        wrong: ["Cache-Control: no-cache", "Cache-Control: public", "Vary: *"],
      };
    },
  },
  {
    id: "http-forbidden",
    topic: "auth",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      const role = pick(rng, ["admin", "billing", "moderator"]);
      return {
        kind: "single",
        prompt: `Токен валиден, но у пользователя нет роли ${role}, которую требует ручка. Какой статус вернуть?`,
        correct: "403",
        wrong: ["401", "400", "500"],
      };
    },
  },
  {
    id: "http-preflight",
    topic: "cors",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const method = pick(rng, ["PUT", "DELETE", "PATCH"]);
      return {
        kind: "single",
        prompt: `Браузер отправляет ${method} с JSON на другой домен. Что уйдёт на сервер до основного запроса?`,
        correct: "OPTIONS-запрос preflight",
        wrong: [
          "HEAD-запрос",
          "Ничего, запрос уйдёт сразу",
          "GET на тот же адрес",
        ],
      };
    },
  },
];
