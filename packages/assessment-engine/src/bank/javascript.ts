import { between, pick, sample, shuffle } from "../random";
import type { Template } from "../types";
import {
  Junior,
  Middle,
  Senior,
  code,
  multi,
  numeric,
  order,
  single,
} from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Своей подсветки для JavaScript нет: обычный JS — подмножество TypeScript.
const js = "typescript";

export const javascript: Template[] = [
  {
    id: "js-typeof",
    topic: "types",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const [value, correct] = pick(rng, [
        ["NaN", '"number"'],
        ["function () {}", '"function"'],
        ["[]", '"object"'],
        ["undefined", '"undefined"'],
      ] as const);
      const pool = [
        '"number"',
        '"function"',
        '"object"',
        '"undefined"',
        '"array"',
        '"NaN"',
      ].filter((option) => {
        return option !== correct;
      });
      return {
        kind: "code",
        lang: js,
        prompt: "Какую строку вернёт typeof?",
        code: `console.log(typeof ${value});`,
        correct,
        wrong: sample(rng, pool, 3),
      };
    },
  },
  code(
    { id: "js-strict-equal", topic: "equality", grades: J, difficulty: 1 },
    js,
    "Что выведет код?",
    'console.log(0 == "", 0 === "");',
    "true false",
    ["false false", "true true", "false true"],
  ),
  code(
    { id: "js-hoist-var", topic: "hoisting", grades: J, difficulty: 1 },
    js,
    "Что выведет код?",
    "console.log(a);\nvar a = 5;",
    "undefined",
    ["5", "ReferenceError", "null"],
  ),
  {
    id: "js-array-hole",
    topic: "arrays",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const items = Array.from({ length: between(rng, 2, 5) }, () => {
        return between(rng, 1, 9);
      });
      const index = between(rng, items.length + 1, items.length + 4);
      return {
        kind: "numeric",
        lang: js,
        prompt: "Какое число выведет код?",
        code: `const xs = [${items.join(", ")}];\nxs[${index}] = 9;\nconsole.log(xs.length);`,
        answer: index + 1,
      };
    },
  },
  {
    id: "js-plus-minus",
    topic: "coercion",
    grades: J,
    difficulty: 1,
    build: (rng) => {
      const a = between(rng, 2, 9);
      const b = between(rng, 1, 9);
      return {
        kind: "code",
        lang: js,
        prompt: "Что выведет код?",
        code: `console.log("${a}" + ${b}, "${a}" - ${b});`,
        correct: `${a}${b} ${a - b}`,
        wrong: [`${a + b} ${a - b}`, `${a}${b} NaN`, `${a + b} NaN`],
      };
    },
  },
  code(
    { id: "js-reference", topic: "references", grades: J, difficulty: 1 },
    js,
    "Что выведет код?",
    "const a = { n: 1 };\nconst b = a;\nb.n = 2;\nconsole.log(a.n);",
    "2",
    ["1", "undefined", "TypeError: const нельзя менять"],
  ),
  code(
    { id: "js-float", topic: "numbers", grades: J, difficulty: 1 },
    js,
    "Что выведет код?",
    "console.log(0.1 + 0.2 === 0.3);",
    "false",
    ["true", "NaN", "SyntaxError"],
  ),
  single(
    { id: "js-nan", topic: "numbers", grades: J, difficulty: 1 },
    "Как надёжно проверить, что в x лежит NaN?",
    "Number.isNaN(x)",
    ["x === NaN", "x == NaN", 'typeof x === "NaN"'],
  ),
  {
    id: "js-falsy",
    topic: "coercion",
    grades: J,
    difficulty: 2,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt: "Какие значения в условии if считаются ложными?",
        correct: sample(rng, ["0", '""', "null", "undefined", "NaN"], 3),
        wrong: sample(rng, ["[]", "{}", '"0"', '"false"'], 2),
      };
    },
  },
  code(
    { id: "js-sort", topic: "arrays", grades: J, difficulty: 2 },
    js,
    "Что выведет код?",
    "console.log([10, 9, 1].sort());",
    "[1, 10, 9]",
    ["[1, 9, 10]", "[10, 9, 1]", "[9, 10, 1]"],
  ),
  code(
    { id: "js-json", topic: "json", grades: JM, difficulty: 2 },
    js,
    "Что выведет код?",
    "console.log(JSON.stringify({ a: undefined, b: 1, c: null }));",
    '{"b":1,"c":null}',
    ['{"a":undefined,"b":1,"c":null}', '{"a":null,"b":1,"c":null}', '{"b":1}'],
  ),
  code(
    { id: "js-tdz", topic: "hoisting", grades: JM, difficulty: 2 },
    js,
    "Что произойдёт?",
    "console.log(x);\nlet x = 1;",
    "Упадёт с ReferenceError",
    ["Выведет undefined", "Выведет 1", "Упадёт с SyntaxError"],
  ),
  code(
    { id: "js-shallow", topic: "references", grades: JM, difficulty: 2 },
    js,
    "Что выведет код?",
    "const a = { p: { n: 1 } };\nconst b = { ...a };\nb.p.n = 2;\nconsole.log(a.p.n);",
    "2",
    ["1", "undefined", "TypeError"],
  ),
  single(
    { id: "js-export", topic: "modules", grades: JM, difficulty: 1 },
    "Чем export default отличается от именованного export?",
    "Default у модуля один, импортируют его под любым именем. Именованных много, имя при импорте совпадает с экспортом или задаётся через as",
    [
      "Default можно импортировать только через require",
      "Именованный экспорт бывает один на модуль, default — сколько угодно",
      "Default нельзя сочетать с именованными экспортами в одном модуле",
    ],
  ),
  {
    id: "js-closure-counter",
    topic: "closures",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const calls = between(rng, 1, 4);
      const other = between(rng, 1, 3);
      const lines = [
        "function counter() {",
        "  let n = 0;",
        "  return () => {",
        "    n += 1;",
        "    return n;",
        "  };",
        "}",
        "const a = counter();",
        "const b = counter();",
        ...Array.from({ length: calls }, () => {
          return "a();";
        }),
        ...Array.from({ length: other }, () => {
          return "b();";
        }),
        "console.log(a());",
      ];
      return {
        kind: "numeric",
        lang: js,
        prompt: "Какое число выведет код?",
        code: lines.join("\n"),
        answer: calls + 1,
      };
    },
  },
  {
    id: "js-loop-timeout",
    topic: "closures",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const size = between(rng, 2, 4);
      const keyword = pick(rng, ["var", "let"]);
      const indexes = Array.from({ length: size }, (_, index) => {
        return String(index);
      }).join(" ");
      const repeat = (value: string) => {
        return Array.from({ length: size }, () => {
          return value;
        }).join(" ");
      };
      const last = repeat(String(size));
      return {
        kind: "code",
        lang: js,
        prompt: "Что появится в консоли, по порядку?",
        code: `for (${keyword} i = 0; i < ${size}; i++) {\n  setTimeout(() => console.log(i));\n}`,
        correct: keyword === "var" ? last : indexes,
        wrong: [
          keyword === "var" ? indexes : last,
          repeat(String(size - 1)),
          repeat("undefined"),
        ],
      };
    },
  },
  code(
    { id: "js-class-this", topic: "this", grades: M, difficulty: 2 },
    js,
    "Что произойдёт?",
    'class User {\n  constructor() {\n    this.name = "Ann";\n  }\n  hi() {\n    return this.name;\n  }\n}\nconst hi = new User().hi;\nconsole.log(hi());',
    "Упадёт с TypeError",
    ["Выведет Ann", "Выведет undefined", "Упадёт с ReferenceError"],
  ),
  code(
    { id: "js-arrow-this", topic: "this", grades: M, difficulty: 2 },
    js,
    "Что выведет код?",
    "const timer = {\n  n: 5,\n  start() {\n    return [1, 2].map(() => this.n);\n  },\n};\nconsole.log(timer.start());",
    "[5, 5]",
    ["[undefined, undefined]", "[1, 2]", "TypeError"],
  ),
  code(
    { id: "js-promise-chain", topic: "promises", grades: M, difficulty: 2 },
    js,
    "Что появится в консоли, по порядку?",
    'Promise.reject(new Error("x"))\n  .then(() => console.log("A"))\n  .catch(() => console.log("B"))\n  .then(() => console.log("C"));',
    "B C",
    ["A B C", "B", "A C"],
  ),
  single(
    { id: "js-all-settled", topic: "promises", grades: M, difficulty: 2 },
    "Один из трёх запросов в Promise.all отклонился. Чем здесь отличается Promise.allSettled?",
    "Дождётся всех трёх и вернёт статус и результат каждого, а Promise.all отклонится на первой ошибке",
    [
      "Отменит два оставшихся запроса, а Promise.all дождётся их",
      "Вернёт только первый успешный результат, а Promise.all — все",
      "Повторит упавший запрос, а Promise.all сразу отклонится",
    ],
  ),
  numeric(
    { id: "js-proto-delete", topic: "prototypes", grades: M, difficulty: 2 },
    "Какое число выведет код?",
    4,
    {
      lang: js,
      code: "function Animal() {}\nAnimal.prototype.legs = 4;\nconst cat = new Animal();\ncat.legs = 3;\ndelete cat.legs;\nconsole.log(cat.legs);",
    },
  ),
  {
    id: "js-map-keys",
    topic: "collections",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const useMap = rng() < 0.5;
      return {
        kind: "numeric",
        lang: js,
        prompt: "Какое число выведет код?",
        code: useMap
          ? 'const m = new Map();\nm.set(1, "a");\nm.set("1", "b");\nconsole.log(m.size);'
          : 'const o = {};\no[1] = "a";\no["1"] = "b";\nconsole.log(Object.keys(o).length);',
        answer: useMap ? 2 : 1,
      };
    },
  },
  code(
    { id: "js-loose-null", topic: "equality", grades: M, difficulty: 3 },
    js,
    "Что выведет код?",
    "console.log([] == false, null == 0, null == undefined);",
    "true false true",
    ["false false true", "true true true", "false false false"],
  ),
  {
    id: "js-event-loop",
    topic: "event-loop",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const [a, b, c, d, e] = shuffle(rng, ["A", "B", "C", "D", "E", "F", "G"]);
      return {
        kind: "code",
        lang: js,
        prompt: "В каком порядке появятся буквы в консоли?",
        code: `console.log("${a}");\nsetTimeout(() => console.log("${b}"), 0);\nPromise.resolve().then(() => console.log("${c}"));\nqueueMicrotask(() => console.log("${d}"));\nconsole.log("${e}");`,
        correct: `${a} ${e} ${c} ${d} ${b}`,
        wrong: [
          `${a} ${b} ${c} ${d} ${e}`,
          `${a} ${e} ${b} ${c} ${d}`,
          `${a} ${c} ${d} ${e} ${b}`,
        ],
      };
    },
  },
  single(
    { id: "js-module-once", topic: "modules", grades: M, difficulty: 2 },
    "Модуль config.js создаёт объект на верхнем уровне. Его импортируют два разных файла. Сколько раз выполнится код модуля?",
    "Один раз: оба импорта получат один и тот же объект",
    [
      "Дважды: у каждого импорта своя копия объекта",
      "Ни разу, пока не вызвать функцию из модуля",
      "При каждом обращении к экспорту заново",
    ],
  ),
  order(
    { id: "js-loop-phases", topic: "event-loop", grades: MS, difficulty: 3 },
    "Расставьте шаги одного витка event loop в браузере по порядку",
    [
      "Выполнить одну задачу из очереди макрозадач",
      "Выполнить все микрозадачи, пока очередь не опустеет",
      "Вызвать колбэки requestAnimationFrame",
      "Пересчитать стили и раскладку, отрисовать кадр",
    ],
  ),
  code(
    { id: "js-bind", topic: "this", grades: MS, difficulty: 2 },
    js,
    "Что выведет код?",
    "const f = function () {\n  return this.x;\n}.bind({ x: 1 });\nconsole.log(f.call({ x: 2 }));",
    "1",
    ["2", "undefined", "TypeError"],
  ),
  {
    id: "js-return-await",
    topic: "async-errors",
    grades: MS,
    difficulty: 3,
    build: (rng) => {
      const awaited = rng() < 0.5;
      return {
        kind: "code",
        lang: js,
        prompt: "Что выведет код?",
        code: `async function load() {\n  throw new Error("boom");\n}\nasync function main() {\n  try {\n    return ${awaited ? "await " : ""}load();\n  } catch {\n    return "caught";\n  }\n}\nmain().then(\n  (value) => console.log("ok", value),\n  (error) => console.log("rejected", error.message),\n);`,
        correct: awaited ? "ok caught" : "rejected boom",
        wrong: [
          awaited ? "rejected boom" : "ok caught",
          "ok undefined",
          "rejected caught",
        ],
      };
    },
  },
  numeric(
    { id: "js-proto-shared", topic: "prototypes", grades: MS, difficulty: 3 },
    "Какое число выведет код?",
    1,
    {
      lang: js,
      code: 'function Team() {}\nTeam.prototype.members = [];\nconst a = new Team();\nconst b = new Team();\na.members.push("Ann");\nconsole.log(b.members.length);',
    },
  ),
  {
    id: "js-await-order",
    topic: "event-loop",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const [a, b, c, d, e, f] = shuffle(rng, [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
      ]);
      return {
        kind: "code",
        lang: js,
        prompt: "В каком порядке появятся буквы в консоли?",
        code: `async function run() {\n  console.log("${a}");\n  await null;\n  console.log("${b}");\n}\nconsole.log("${c}");\nrun();\nsetTimeout(() => console.log("${d}"));\nPromise.resolve().then(() => console.log("${e}"));\nconsole.log("${f}");`,
        correct: `${c} ${a} ${f} ${b} ${e} ${d}`,
        wrong: [
          `${c} ${a} ${b} ${f} ${e} ${d}`,
          `${c} ${a} ${f} ${e} ${b} ${d}`,
          `${c} ${a} ${f} ${b} ${d} ${e}`,
        ],
      };
    },
  },
  code(
    { id: "js-keys-order", topic: "objects", grades: S, difficulty: 3 },
    js,
    "Что выведет код?",
    "console.log(Object.keys({ b: 1, 2: 1, a: 1, 1: 1 }));",
    '["1", "2", "b", "a"]',
    ['["b", "2", "a", "1"]', '["a", "b", "1", "2"]', '["b", "a", "1", "2"]'],
  ),
  {
    id: "js-live-binding",
    topic: "modules",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const esm = rng() < 0.5;
      return {
        kind: "numeric",
        lang: js,
        prompt: "Какое число выведет main?",
        code: esm
          ? '// counter.mjs\nexport let count = 0;\nexport function inc() {\n  count += 1;\n}\n\n// main.mjs\nimport { count, inc } from "./counter.mjs";\ninc();\nconsole.log(count);'
          : '// counter.js\nlet count = 0;\nfunction inc() {\n  count += 1;\n}\nmodule.exports = { count, inc };\n\n// main.js\nconst { count, inc } = require("./counter");\ninc();\nconsole.log(count);',
        answer: esm ? 1 : 0,
      };
    },
  },
  single(
    { id: "js-foreach-async", topic: "async-errors", grades: S, difficulty: 3 },
    'Код: items.forEach(async (item) => { await save(item); }); console.log("done"). Что не так?',
    "forEach не ждёт промисы колбэка: done выводится до сохранения, а ошибка save останется без обработчика",
    [
      "forEach выполнит save строго по одному и только потом выведет done",
      "await внутри forEach запрещён, код не запустится",
      "forEach вернёт промис, его достаточно дождаться через await",
    ],
  ),
  code(
    {
      id: "js-async-sync-start",
      topic: "event-loop",
      grades: S,
      difficulty: 3,
    },
    js,
    "Что появится в консоли, по порядку?",
    'async function load() {\n  try {\n    return "data";\n  } finally {\n    console.log("cleanup");\n  }\n}\nload().then((value) => console.log(value));\nconsole.log("sync");',
    "cleanup sync data",
    ["sync cleanup data", "sync data cleanup", "cleanup data sync"],
  ),
  single(
    {
      id: "js-microtask-starve",
      topic: "event-loop",
      grades: S,
      difficulty: 3,
    },
    "Колбэк микрозадачи каждый раз ставит в очередь новую микрозадачу через queueMicrotask. Что будет со страницей?",
    "Зависнет: очередь микрозадач не пустеет, таймеры и отрисовка не получают хода",
    [
      "Ничего: браузер чередует микрозадачи с таймерами",
      "Микрозадачи станут макрозадачами после тысячи повторов",
      "Браузер выбросит RangeError, как при глубокой рекурсии",
    ],
  ),
  multi(
    { id: "js-leaks", topic: "memory", grades: S, difficulty: 3 },
    "SPA работает часами, память вкладки растёт. Что из этого держит объекты в памяти?",
    [
      "Обработчик на window, который добавляется при каждом открытии экрана и не снимается",
      "setInterval, который ссылается на данные закрытого экрана и не очищен",
      "Глобальный Map-кэш, куда кладут объекты по запросу и ничего не удаляют",
    ],
    [
      "WeakMap, ключи которого больше нигде не используются",
      "Локальная переменная функции, которая уже вернула результат и не попала в замыкание",
    ],
  ),
];
