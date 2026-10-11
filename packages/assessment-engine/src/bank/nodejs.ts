import { between, pick } from "../random";
import type { Template } from "../types";
import { Junior, Middle, Senior, code, order, single } from "./question";

const J = [Junior];
const JM = [Junior, Middle];
const M = [Middle];
const MS = [Middle, Senior];
const S = [Senior];

// Вопросы про платформу: цикл событий, потоки, модули, ошибки в асинхронном коде, процессы. Язык проверяет банк TypeScript.
export const nodejs: Template[] = [
  single(
    { id: "node-esm", topic: "modules", grades: J, difficulty: 1 },
    "Файл index.js с import падает: «Cannot use import statement outside a module». Что включает ESM для этого файла?",
    '"type": "module" в package.json или расширение .mjs',
    [
      '"type": "commonjs" в package.json или расширение .cjs',
      "Флаг --harmony при запуске node",
      'Строка "use strict" в начале файла',
    ],
  ),
  single(
    { id: "node-single-thread", topic: "event-loop", grades: J, difficulty: 1 },
    "Обработчик Express две секунды крутит синхронный цикл. Что в это время с другими запросами к процессу?",
    "Ждут: JavaScript в процессе выполняется в одном потоке",
    [
      "Обрабатываются параллельно в пуле потоков libuv",
      "Обрабатываются в новом процессе, который Node.js запускает сам",
      "Получают 503 от Express, пока цикл не закончится",
    ],
  ),
  single(
    { id: "node-npm-ci", topic: "npm", grades: J, difficulty: 1 },
    "Чем npm ci отличается от npm install?",
    "Ставит строго по package-lock.json и падает при расхождении с package.json",
    [
      "Обновляет зависимости до последних версий и переписывает package-lock.json",
      "Ставит только devDependencies для запуска тестов",
      "Игнорирует package-lock.json и берёт версии из package.json",
    ],
  ),
  single(
    { id: "node-read-sync", topic: "blocking", grades: J, difficulty: 1 },
    "Почему fs.readFileSync в обработчике HTTP-запроса — плохая идея?",
    "Пока файл читается, цикл событий стоит и другие запросы ждут",
    [
      "Пока файл читается, другие запросы получают ошибку EBUSY",
      "readFileSync читает только первые 64 КБ файла",
      "readFileSync доступен только в CommonJS",
    ],
  ),
  single(
    { id: "node-env", topic: "process", grades: J, difficulty: 1 },
    "Как в Node.js прочитать переменную окружения PORT?",
    "process.env.PORT",
    ["process.argv.PORT", 'require("env").PORT', "globalThis.PORT"],
  ),
  single(
    { id: "node-semver", topic: "npm", grades: J, difficulty: 1 },
    'В package.json указано "express": "^4.18.2". Какую версию npm может поставить?',
    "4.21.0",
    ["5.0.0", "4.18.1", "3.9.9"],
  ),
  single(
    { id: "node-next", topic: "middleware", grades: J, difficulty: 1 },
    "Middleware Express не отвечает сам. Что он должен сделать?",
    "Вызвать next(), иначе запрос повиснет",
    [
      "Вернуть true, иначе запрос повиснет",
      "Ничего: Express сам перейдёт к следующему",
      "Бросить исключение, чтобы Express перешёл дальше",
    ],
  ),
  code(
    { id: "node-exports", topic: "modules", grades: JM, difficulty: 2 },
    "typescript",
    "Что выведет app.js? Оба файла — CommonJS.",
    '// math.js\nexports = { add: (a, b) => a + b };\n\n// app.js\nconst math = require("./math");\nconsole.log(typeof math.add);',
    "undefined",
    ["function", "object", "Ошибку Cannot find module"],
  ),
  code(
    {
      id: "node-express-order",
      topic: "middleware",
      grades: JM,
      difficulty: 2,
    },
    "typescript",
    "Что вернёт GET /b?",
    'app.get("/a", (req, res) => {\n  res.send("a");\n});\napp.use((req, res) => {\n  res.status(404).send("nf");\n});\napp.get("/b", (req, res) => {\n  res.send("b");\n});',
    "404 и nf",
    ["200 и b", "404 с пустым телом", "500: маршрут объявлен после use"],
  ),
  code(
    { id: "node-throw-timer", topic: "errors", grades: JM, difficulty: 2 },
    "typescript",
    "Что произойдёт?",
    'try {\n  setTimeout(() => {\n    throw new Error("boom");\n  }, 0);\n} catch (e) {\n  console.log("caught");\n}',
    "caught не выведется, процесс упадёт с необработанным исключением",
    [
      "Выведется caught, и процесс продолжит работу как обычно",
      "Выведется caught, потом процесс упадёт с исключением",
      "Ничего не выведется, ошибка таймера пропадёт молча",
    ],
  ),
  single(
    { id: "node-unhandled", topic: "errors", grades: M, difficulty: 2 },
    "Что по умолчанию делает Node.js 15+ при необработанном отклонении промиса?",
    "Завершает процесс с ошибкой",
    [
      "Пишет предупреждение и продолжает работу",
      "Повторяет промис ещё раз",
      "Молча игнорирует отклонение",
    ],
  ),
  code(
    { id: "node-express4-async", topic: "errors", grades: M, difficulty: 2 },
    "typescript",
    "Express 4, обёрток для async нет. findUser отклоняется. Что будет?",
    'app.get("/user/:id", async (req, res) => {\n  const user = await findUser(req.params.id);\n  res.json(user);\n});\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n});',
    "Обработчик ошибок не вызовется: отклонённый промис останется необработанным",
    [
      "Обработчик ошибок вызовется: Express 4 ждёт промис и ответит 500",
      "Express ответит 500 сам, а обработчик ошибок пропустит",
      "Express ответит 200 с пустым телом, ошибка уйдёт в лог",
    ],
  ),
  single(
    { id: "node-promise-all", topic: "promises", grades: M, difficulty: 2 },
    "В Promise.all три запроса: второй отклоняется через 100 мс, остальные идут по секунде. Что будет?",
    "Через 100 мс Promise.all отклонится, а два других запроса продолжат выполняться",
    [
      "Через 100 мс Promise.all отклонится, а два других запроса отменятся",
      "Через секунду Promise.all отклонится с ошибкой второго запроса",
      "Через секунду Promise.all вернёт массив из двух результатов",
    ],
  ),
  {
    id: "node-await-loop",
    topic: "promises",
    grades: M,
    difficulty: 2,
    build: (rng) => {
      const count = between(rng, 3, 8);
      const parallel = pick(rng, [true, false]);
      const source = parallel
        ? "await Promise.all(ids.map((id) => fetchUser(id)));"
        : "for (const id of ids) {\n  await fetchUser(id);\n}";
      return {
        kind: "numeric",
        lang: "typescript",
        prompt: `В ids ${count} элементов, fetchUser отвечает ровно за 200 мс и не ограничен по параллельности. Сколько миллисекунд займёт код?`,
        code: source,
        answer: parallel ? 200 : count * 200,
      };
    },
  },
  single(
    { id: "node-drain", topic: "streams", grades: M, difficulty: 2 },
    "writable.write(chunk) вернул false. Что правильно сделать?",
    "Остановить запись и продолжить после события drain",
    [
      "Повторить write с тем же chunk: он не записался",
      "Вызвать end и открыть поток заново",
      "Остановить запись и продолжить после события finish",
    ],
  ),
  single(
    { id: "node-worker", topic: "parallelism", grades: M, difficulty: 2 },
    "Сервису нужно считать тяжёлую математику на CPU и не тормозить ответы. Что взять?",
    "worker_threads: отдельные потоки со своим движком V8",
    [
      "Promise.all: промисы выполняются в разных потоках",
      "async-функции: они не занимают цикл событий",
      "process.nextTick: он откладывает работу в фоновый поток",
    ],
  ),
  code(
    { id: "node-microtasks", topic: "event-loop", grades: MS, difficulty: 2 },
    "typescript",
    "Что выведет файл index.cjs?",
    'console.log("A");\nsetTimeout(() => {\n  console.log("B");\n}, 0);\nPromise.resolve().then(() => {\n  console.log("C");\n});\nprocess.nextTick(() => {\n  console.log("D");\n});\nconsole.log("E");',
    "A E D C B",
    ["A E C D B", "A E B D C", "A D C E B"],
  ),
  single(
    { id: "node-pipeline", topic: "streams", grades: MS, difficulty: 2 },
    "Зачем stream.pipeline вместо readable.pipe(writable)?",
    "pipeline передаёт ошибку и закрывает все потоки цепочки при сбое любого",
    [
      "pipeline учитывает backpressure, а pipe пишет без оглядки на буфер",
      "pipeline читает источник целиком и пишет одним куском",
      "pipeline работает с сокетами, а pipe только с файлами",
    ],
  ),
  single(
    { id: "node-cluster", topic: "parallelism", grades: MS, difficulty: 2 },
    "Что делает модуль cluster?",
    "Запускает несколько процессов Node.js, которые слушают один порт",
    [
      "Запускает несколько потоков в одном процессе с общей памятью",
      "Объединяет несколько машин в один кластер с общим портом",
      "Распределяет промисы одного процесса по ядрам процессора",
    ],
  ),
  single(
    { id: "node-create-require", topic: "modules", grades: MS, difficulty: 2 },
    "Как в ESM-модуле загрузить CommonJS-пакет через require?",
    "Создать require через createRequire(import.meta.url)",
    [
      "Вызвать require напрямую: в ESM он тоже глобальный",
      "Вызвать module.require из глобального объекта",
      "Никак: ESM не умеет загружать CommonJS",
    ],
  ),
  order(
    { id: "node-phases", topic: "event-loop", grades: MS, difficulty: 3 },
    "Расставьте фазы одного оборота цикла событий Node.js по порядку",
    [
      "timers: колбэки setTimeout и setInterval",
      "pending callbacks: отложенные системные колбэки",
      "poll: новые события ввода-вывода",
      "check: колбэки setImmediate",
      "close callbacks: события close",
    ],
  ),
  {
    id: "node-threadpool",
    topic: "libuv",
    grades: S,
    difficulty: 3,
    build: (rng) => {
      const rounds = between(rng, 2, 3);
      const calls = rounds * 4;
      return {
        kind: "numeric",
        lang: "typescript",
        prompt:
          "UV_THREADPOOL_SIZE не задан, ядер 8. Один вызов pbkdf2 считается около секунды. Через сколько секунд примерно выведется последнее число?",
        code: `const crypto = require("crypto");\nfor (let i = 0; i < ${calls}; i++) {\n  crypto.pbkdf2("p", "s", 1e6, 64, "sha512", () => {\n    console.log(i);\n  });\n}`,
        answer: rounds,
      };
    },
  },
  code(
    { id: "node-immediate", topic: "event-loop", grades: S, difficulty: 3 },
    "typescript",
    "Что выведет код?",
    'const fs = require("fs");\nfs.readFile(__filename, () => {\n  setTimeout(() => {\n    console.log("timeout");\n  }, 0);\n  setImmediate(() => {\n    console.log("immediate");\n  });\n});',
    "Всегда immediate, потом timeout",
    [
      "Всегда timeout, потом immediate",
      "Порядок зависит от загрузки машины",
      "Только immediate: таймер внутри колбэка отменяется",
    ],
  ),
  single(
    { id: "node-leak", topic: "memory", grades: S, difficulty: 3 },
    "Память процесса Node.js растёт под нагрузкой и не падает после сборки мусора. Что чаще всего виновато?",
    "Долгоживущий объект держит ссылки: кеш без вытеснения или слушатели",
    [
      "Сборщик мусора V8 не запускается без вызова global.gc()",
      "Строки в V8 не освобождаются, пока процесс не перезапустят",
      "Промисы после resolve остаются в памяти до конца процесса",
    ],
  ),
  order(
    { id: "node-shutdown", topic: "process", grades: S, difficulty: 3 },
    "Как HTTP-сервис на Node.js корректно останавливается по SIGTERM?",
    [
      'Поймать сигнал через process.on("SIGTERM")',
      "Вызвать server.close(), чтобы не принимать новые соединения",
      "Дождаться завершения запросов в работе",
      "Закрыть пулы базы и подключения к очередям",
      "Выйти с кодом 0",
    ],
  ),
  single(
    { id: "node-als", topic: "context", grades: S, difficulty: 3 },
    "Как передать requestId во все логи запроса, не прокидывая его аргументом?",
    "AsyncLocalStorage: контекст сохраняется через все await внутри запроса",
    [
      "Глобальная переменная: Node.js однопоточный, запросы не пересекаются",
      "process.env.REQUEST_ID, который ставится в начале запроса",
      "Поле модуля logger, которое ставится в начале запроса",
    ],
  ),
  single(
    { id: "node-json-parse", topic: "blocking", grades: S, difficulty: 3 },
    "Сервис принимает JSON по 200 МБ, и задержки растут у всех запросов, даже у мелких. Почему?",
    "JSON.parse синхронный и держит цикл событий всё время разбора",
    [
      "JSON.parse идёт в пуле libuv и занимает все его потоки",
      "Большое тело запроса блокирует порт до конца загрузки",
      "V8 ставит другие запросы на паузу до конца загрузки тела",
    ],
  ),
];
