import { Grade } from "@hh/types";

import { between, pick, sample } from "../random";
import type { Template } from "../types";
import { postgresMore } from "./more";

const { Junior, Middle, Senior } = Grade;

export const postgresql: Template[] = [
  {
    id: "pg-limit",
    topic: "select",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const limit = between(rng, 2, 9);
      const rows = limit * between(rng, 5, 12);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `В таблице users ${rows} строк. Сколько строк вернёт запрос?`,
        code: `SELECT * FROM users LIMIT ${limit};`,
        answer: limit,
      };
    },
  },
  {
    id: "pg-offset",
    topic: "pagination",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      const offset = between(rng, 1, 40);
      const limit = between(rng, 2, 20);
      return {
        kind: "numeric",
        lang: "sql",
        prompt:
          "id в таблице идут подряд: 1, 2, 3… Какой первый id вернёт запрос?",
        code: `SELECT id FROM items ORDER BY id OFFSET ${offset} LIMIT ${limit};`,
        answer: offset + 1,
      };
    },
  },
  {
    id: "pg-count-null",
    topic: "nulls",
    grades: [Junior, Middle],
    difficulty: 2,
    build: (rng) => {
      const total = between(rng, 10, 60);
      const empty = between(rng, 1, total - 1);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `В таблице users ${total} строк, у ${empty} из них email равен NULL. Что вернёт запрос?`,
        code: "SELECT count(email) FROM users;",
        answer: total - empty,
      };
    },
  },
  {
    id: "pg-left-join",
    topic: "joins",
    grades: [Junior, Middle],
    difficulty: 2,
    build: (rng) => {
      const users = between(rng, 5, 30);
      const buyers = between(rng, 1, users - 1);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `В users ${users} строк. Заказ есть у ${buyers} пользователей, ровно по одному. Сколько строк вернёт запрос?`,
        code: "SELECT * FROM users u LEFT JOIN orders o ON o.user_id = u.id;",
        answer: users,
      };
    },
  },
  {
    id: "pg-inner-join",
    topic: "joins",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const users = between(rng, 5, 30);
      const buyers = between(rng, 1, users - 1);
      const perBuyer = between(rng, 2, 5);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `В users ${users} строк. У ${buyers} пользователей по ${perBuyer} заказа, у остальных заказов нет. Сколько строк вернёт запрос?`,
        code: "SELECT * FROM users u JOIN orders o ON o.user_id = u.id;",
        answer: buyers * perBuyer,
      };
    },
  },
  {
    id: "pg-having",
    topic: "aggregates",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const sizes = [
        between(rng, 1, 9),
        between(rng, 1, 9),
        between(rng, 1, 9),
      ];
      const threshold = between(rng, 2, 6);
      const [a, b, c] = sizes;
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `В staff три отдела: в A ${a} чел., в B ${b}, в C ${c}. Сколько строк вернёт запрос?`,
        code: `SELECT dept, count(*) FROM staff GROUP BY dept HAVING count(*) > ${threshold};`,
        answer: sizes.filter((size) => {
          return size > threshold;
        }).length,
      };
    },
  },
  {
    id: "pg-aggregate-functions",
    topic: "aggregates",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие из функций агрегатные?",
        correct: sample(
          rng,
          ["count", "sum", "avg", "max", "min"],
          between(rng, 2, 3),
        ),
        wrong: sample(rng, ["lower", "coalesce", "length", "now"], 2),
      };
    },
  },
  {
    id: "pg-index-equality",
    topic: "indexes",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const email = `${pick(rng, ["anna", "oleg", "ivan", "mila"])}@${pick(rng, ["mail.ru", "corp.dev", "ya.ru"])}`;
      return {
        kind: "single",
        prompt:
          "Есть обычный B-tree индекс на users(email). Какое условие сможет искать по нему?",
        correct: `WHERE email = '${email}'`,
        wrong: [
          `WHERE lower(email) = '${email}'`,
          `WHERE email LIKE '%${email.slice(email.indexOf("@"))}'`,
          `WHERE email || '' = '${email}'`,
        ],
      };
    },
  },
  {
    id: "pg-rollback",
    topic: "transactions",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const inserts = between(rng, 2, 9);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `Внутри BEGIN выполнили ${inserts} INSERT, затем ROLLBACK. Сколько строк добавится в таблицу?`,
        answer: 0,
      };
    },
  },
  {
    id: "pg-for-update",
    topic: "transactions",
    grades: [Middle, Senior],
    difficulty: 2,
    build: () => {
      return {
        kind: "single",
        prompt:
          "Как прочитать строку и не дать другой транзакции изменить её до коммита?",
        correct: "SELECT … FOR UPDATE",
        wrong: [
          "SELECT … LIMIT 1",
          "SET TRANSACTION READ ONLY",
          "SELECT DISTINCT …",
        ],
      };
    },
  },
  {
    id: "pg-read-committed",
    topic: "transactions",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      const balance = 100 * between(rng, 1, 9);
      const debit = 10 * between(rng, 1, 9);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `Две транзакции прочитали баланс ${balance}. Первая списала ${debit} и закоммитила. Вторая в READ COMMITTED читает баланс снова. Какое значение она увидит?`,
        answer: balance - debit,
      };
    },
  },
  {
    id: "pg-lost-update",
    topic: "transactions",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      const value = between(rng, 10, 90);
      return {
        kind: "numeric",
        lang: "sql",
        prompt: `Две транзакции в READ COMMITTED одновременно читают counter = ${value} и пишут counter = прочитанное + 1 без блокировок. Какое итоговое значение получится при потерянном обновлении?`,
        answer: value + 1,
      };
    },
  },
  {
    id: "pg-unique-null",
    topic: "constraints",
    grades: [Middle, Senior],
    difficulty: 2,
    build: () => {
      return {
        kind: "single",
        prompt:
          "На колонке code обычный UNIQUE без NULLS NOT DISTINCT. Сколько строк с code = NULL можно вставить?",
        correct: "Сколько угодно",
        wrong: ["Одну", "Ни одной", "Две"],
      };
    },
  },
  {
    id: "pg-not-null-migration",
    topic: "constraints",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      const column = pick(rng, ["status", "region", "source"]);
      return {
        kind: "order",
        prompt: `Расставьте шаги: колонка ${column} должна стать NOT NULL в большой таблице без долгой блокировки.`,
        steps: [
          `Добавить ${column} без NOT NULL`,
          "Заполнить значения пачками",
          `Добавить CHECK (${column} IS NOT NULL) NOT VALID`,
          "Выполнить VALIDATE CONSTRAINT",
          `Сделать SET NOT NULL для ${column}`,
        ],
      };
    },
  },
  ...postgresMore,
];
