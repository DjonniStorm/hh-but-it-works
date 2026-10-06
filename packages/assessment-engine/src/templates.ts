import { Grade } from "@hh/types";

export type Stem = {
  prompt: string;
  correct: string;
  wrong: string[];
};

export type Template = (rng: () => number) => Stem;

// Каталог навыков. Своего названия вне этого списка в попытке нет.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const slugs = [
  "postgresql",
  "http-api",
  "typescript",
  "docker",
  "testing",
] as const;

export type CatalogSlug = (typeof slugs)[number];

function between(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

const postgresql: Record<Grade, Template> = {
  [Grade.Junior]: (rng) => {
    const limit = between(rng, 2, 9);
    const rows = limit * 10;
    return {
      prompt: `В таблице users ${rows} строк. Сколько строк вернёт SELECT * FROM users LIMIT ${limit}?`,
      correct: String(limit),
      wrong: [String(rows), String(limit + 1), "0"],
    };
  },
  [Grade.Middle]: (rng) => {
    const offset = between(rng, 1, 5);
    const limit = between(rng, 1, 4);
    return {
      prompt: `id идут 1, 2, 3… Запрос ORDER BY id OFFSET ${offset} LIMIT ${limit}. Какой первый id в ответе?`,
      correct: String(offset + 1),
      wrong: [String(offset), String(limit), String(offset + limit)],
    };
  },
  [Grade.Senior]: (rng) => {
    const balance = 100 * between(rng, 1, 5);
    const debit = 10 * between(rng, 1, 4);
    return {
      prompt: `Две транзакции читают баланс ${balance}. Первая списывает ${debit} и коммитит. Вторая в READ COMMITTED читает снова. Какой баланс она увидит?`,
      correct: String(balance - debit),
      wrong: [String(balance), String(balance - debit * 2), "0"],
    };
  },
};

const httpApi: Record<Grade, Template> = {
  [Grade.Junior]: (rng) => {
    const created = between(rng, 1, 4);
    return {
      prompt: `POST создал ${created} ресурс(ов) и больше ничего не отдаёт в теле. Какой статус уместен?`,
      correct: "201",
      wrong: ["200", "204", "404"],
    };
  },
  [Grade.Middle]: (rng) => {
    const page = between(rng, 1, 4);
    const size = [10, 20, 50][between(rng, 0, 2)] ?? 10;
    return {
      prompt: `GET /items?page=${page}&size=${size}. Страницы с 1. Какой offset у первой записи страницы?`,
      correct: String((page - 1) * size),
      wrong: [String(page * size), String(size), String(page)],
    };
  },
  [Grade.Senior]: (rng) => {
    const retries = between(rng, 2, 5);
    return {
      prompt: `Клиент повторил POST ${retries} раза с одним Idempotency-Key. Сервер сохранил ответ первого вызова. Сколько ресурсов создастся?`,
      correct: "1",
      wrong: [String(retries), String(retries + 1), "0"],
    };
  },
};

const typescript: Record<Grade, Template> = {
  [Grade.Junior]: (rng) => {
    const extra = between(rng, 1, 9);
    return {
      prompt: `const xs = [1, 2, 3]; const n = xs.push(${extra}); чему равно n?`,
      correct: "4",
      wrong: [String(extra), "3", String(extra + 3)],
    };
  },
  [Grade.Middle]: (rng) => {
    const fallback = between(rng, 1, 9);
    return {
      prompt: `function f(x: number | null) { return x ?? ${fallback}; } Чему равно f(null)?`,
      correct: String(fallback),
      wrong: ["null", "0", "undefined"],
    };
  },
  [Grade.Senior]: (rng) => {
    const length = between(rng, 2, 6);
    return {
      prompt: `Массив объявлен как readonly number[] и уже содержит ${length} чисел. Сколько элементов можно добавить вызовом push без ошибки типа?`,
      correct: "0",
      wrong: [String(length), "1", "undefined"],
    };
  },
};

const docker: Record<Grade, Template> = {
  [Grade.Junior]: (rng) => {
    const port = 3000 + between(rng, 0, 5);
    return {
      prompt: `Процесс в контейнере слушает ${port}. Какой флаг опубликует этот порт на хост под тем же номером?`,
      correct: `-p ${port}:${port}`,
      wrong: [`-p ${port}`, `--port ${port}`, `-e PORT=${port}`],
    };
  },
  [Grade.Middle]: (rng) => {
    const memory = [128, 256, 512][between(rng, 0, 2)] ?? 128;
    return {
      prompt: `Контейнеру нужно не больше ${memory} мегабайт памяти. Какой флаг это задаёт?`,
      correct: `--memory ${memory}m`,
      wrong: [`--cpus ${memory}`, `-m ${memory}g`, `--memory-swap ${memory}`],
    };
  },
  [Grade.Senior]: (rng) => {
    const layers = between(rng, 2, 5);
    return {
      prompt: `В Dockerfile ${layers} отдельных инструкций RUN, и они не объединены. Сколько слоёв RUN будет в образе?`,
      correct: String(layers),
      wrong: ["1", String(layers + 1), "0"],
    };
  },
};

const testing: Record<Grade, Template> = {
  [Grade.Junior]: (rng) => {
    const failed = between(rng, 1, 4);
    const total = failed + between(rng, 3, 7);
    return {
      prompt: `В прогоне ${total} тестов, упало ${failed}. Сколько прошло?`,
      correct: String(total - failed),
      wrong: [String(total), String(failed), String(total + failed)],
    };
  },
  [Grade.Middle]: (rng) => {
    const branches = between(rng, 2, 6);
    return {
      prompt: `В функции ${branches} ветки. Сколько тестов нужно минимум, чтобы каждая выполнилась хотя бы раз?`,
      correct: String(branches),
      wrong: [String(branches + 1), String(branches - 1), "1"],
    };
  },
  [Grade.Senior]: (rng) => {
    const runs = between(rng, 3, 8);
    return {
      prompt: `Один и тот же тест запустили ${runs} раз без смены кода. Красным был только один прогон. Сколько прогонов зелёные?`,
      correct: String(runs - 1),
      wrong: [String(runs), "1", "0"],
    };
  },
};

export const templates: Record<CatalogSlug, Record<Grade, Template>> = {
  postgresql,
  "http-api": httpApi,
  typescript,
  docker,
  testing,
};

export function isCatalogSlug(slug: string): slug is CatalogSlug {
  return slug in templates;
}
