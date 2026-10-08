import { Grade } from "@hh/types";

import { between, pick, sample, shuffle } from "../random";
import type { Template } from "../types";
import { typescriptMore } from "./more";

const { Junior, Middle, Senior } = Grade;

export const typescript: Template[] = [
  {
    id: "ts-push",
    topic: "arrays",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const items = Array.from({ length: between(rng, 2, 6) }, () => {
        return between(rng, 1, 9);
      });
      const extra = between(rng, 10, 99);
      return {
        kind: "numeric",
        lang: "typescript",
        prompt: "Чему равно n?",
        code: `const xs = [${items.join(", ")}];\nconst n = xs.push(${extra});`,
        answer: items.length + 1,
      };
    },
  },
  {
    id: "ts-filter-length",
    topic: "arrays",
    grades: [Junior, Middle],
    difficulty: 2,
    build: (rng) => {
      const items = Array.from({ length: 6 }, () => {
        return between(rng, 1, 20);
      });
      const threshold = between(rng, 5, 15);
      return {
        kind: "numeric",
        lang: "typescript",
        prompt: "Чему равно count?",
        code: `const count = [${items.join(", ")}].filter((x) => x > ${threshold}).length;`,
        answer: items.filter((item) => {
          return item > threshold;
        }).length,
      };
    },
  },
  {
    id: "ts-nullish",
    topic: "nullish",
    grades: [Junior, Middle],
    difficulty: 2,
    build: (rng) => {
      const fallback = between(rng, 1, 9);
      const operator = pick(rng, ["??", "||"]);
      const input = pick(rng, ["null", "0"]);
      const correct =
        input === "0" && operator === "??" ? "0" : String(fallback);
      return {
        kind: "code",
        lang: "typescript",
        prompt: "Что вернёт вызов?",
        code: `function f(x: number | null) {\n  return x ${operator} ${fallback};\n}\nf(${input});`,
        correct,
        wrong: [correct === "0" ? String(fallback) : "0", "null", "undefined"],
      };
    },
  },
  {
    id: "ts-optional-chaining",
    topic: "nullish",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const field = pick(rng, ["name", "city", "phone"]);
      return {
        kind: "code",
        lang: "typescript",
        prompt: "Чему равно value?",
        code: `const user: { profile: { ${field}: string } | null } = { profile: null };\nconst value = user.profile?.${field};`,
        correct: "undefined",
        wrong: ["null", "Будет TypeError", '""'],
      };
    },
  },
  {
    id: "ts-typeof",
    topic: "types",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const value = pick(rng, ["null", "[]", "{}"]);
      return {
        kind: "code",
        lang: "typescript",
        prompt: "Что выведет код?",
        code: `console.log(typeof ${value});`,
        correct: '"object"',
        wrong: [
          value === "[]" ? '"array"' : '"null"',
          '"undefined"',
          '"number"',
        ],
      };
    },
  },
  {
    id: "ts-const-object",
    topic: "variables",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const next = between(rng, 2, 9);
      return {
        kind: "code",
        lang: "typescript",
        prompt: "Что произойдёт?",
        code: `const box = { n: 1 };\nbox.n = ${next};`,
        correct: `box.n станет ${next}`,
        wrong: [
          "Ошибка: const нельзя менять",
          "box станет undefined",
          "box.n останется 1",
        ],
      };
    },
  },
  {
    id: "ts-readonly",
    topic: "readonly",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const length = between(rng, 2, 6);
      return {
        kind: "single",
        prompt: `Массив объявлен как readonly number[] и уже содержит ${length} чисел. Сколько элементов можно добавить через push без ошибки типа?`,
        correct: "Ни одного: у readonly-массива нет push",
        wrong: [String(length), "Один", "Сколько угодно"],
      };
    },
  },
  {
    id: "ts-narrowing",
    topic: "narrowing",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const useString = rng() < 0.5;
      const text = pick(rng, ["kit", "redis", "nest", "vite"]);
      const number = between(rng, 2, 40);
      return {
        kind: "numeric",
        lang: "typescript",
        prompt: "Что вернёт вызов?",
        code: `function f(x: string | number) {\n  if (typeof x === "string") {\n    return x.length;\n  }\n  return x * 2;\n}\nf(${useString ? `"${text}"` : number});`,
        answer: useString ? text.length : number * 2,
      };
    },
  },
  {
    id: "ts-event-loop",
    topic: "async",
    grades: [Middle, Senior],
    difficulty: 3,
    build: (rng) => {
      const [a, b, c, d] = shuffle(rng, ["A", "B", "C", "D", "E", "F"]);
      return {
        kind: "code",
        lang: "typescript",
        prompt: "В каком порядке появятся буквы в консоли?",
        code: `console.log("${a}");\nsetTimeout(() => console.log("${b}"));\nPromise.resolve().then(() => console.log("${c}"));\nconsole.log("${d}");`,
        correct: `${a} ${d} ${c} ${b}`,
        wrong: [
          `${a} ${b} ${c} ${d}`,
          `${a} ${c} ${d} ${b}`,
          `${a} ${d} ${b} ${c}`,
        ],
      };
    },
  },
  {
    id: "ts-promise-all",
    topic: "async",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const delays = [
        between(rng, 1, 9),
        between(rng, 1, 9),
        between(rng, 1, 9),
      ].map((value) => {
        return value * 100;
      });
      return {
        kind: "numeric",
        lang: "typescript",
        prompt:
          "Сколько миллисекунд примерно займёт ожидание? delay(ms) резолвится через ms.",
        code: `await Promise.all([${delays
          .map((value) => {
            return `delay(${value})`;
          })
          .join(", ")}]);`,
        answer: Math.max(...delays),
      };
    },
  },
  {
    id: "ts-closure-loop",
    topic: "closures",
    grades: [Middle, Senior],
    difficulty: 3,
    build: (rng) => {
      const size = between(rng, 3, 7);
      const keyword = pick(rng, ["var", "let"]);
      return {
        kind: "numeric",
        lang: "typescript",
        prompt: "Что вернёт последняя строка?",
        code: `const fns: (() => number)[] = [];\nfor (${keyword} i = 0; i < ${size}; i++) {\n  fns.push(() => i);\n}\nfns[0]();`,
        answer: keyword === "var" ? size : 0,
      };
    },
  },
  {
    id: "ts-keyof",
    topic: "generics",
    grades: [Senior],
    difficulty: 2,
    build: (rng) => {
      const [first, second] = sample(
        rng,
        ["id", "name", "email", "role", "age"],
        2,
      );
      return {
        kind: "code",
        lang: "typescript",
        prompt: "Чему равен тип K?",
        code: `type User = { ${first}: number; ${second}: string };\ntype K = keyof User;`,
        correct: `"${first}" | "${second}"`,
        wrong: ["string", "number | string", "User"],
      };
    },
  },
  {
    id: "ts-utility-types",
    topic: "generics",
    grades: [Middle, Senior],
    difficulty: 1,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие утилитарные типы есть в TypeScript без библиотек?",
        correct: sample(
          rng,
          ["Partial", "Pick", "Omit", "Record", "Readonly"],
          3,
        ),
        wrong: sample(rng, ["Optional", "Mutable", "Nullable"], 2),
      };
    },
  },
  ...typescriptMore,
];
