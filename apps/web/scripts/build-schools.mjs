#!/usr/bin/env node
// Собирает список учебных заведений РФ для подсказки в поле «Учебное заведение» анкеты.
//
// Сейчас источник — Wikidata (лицензия CC0): официальный реестр Минобрнауки/ЕГАС из окружения
// сборки не скачивается (госсайты не резолвятся). Когда появится выгрузка реестра, добавьте
// в этот скрипт разбор её формата — выход и место данных в коде не меняются.
//
// Из выгрузки отбрасываются факультеты, здания, адреса, филиалы и прочий мусор (см. ниже).
//
// Запуск: node apps/web/scripts/build-schools.mjs --refresh
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const rawDir = path.join(repoRoot, "ignore", "schools-raw");
const outFile = path.join(
  repoRoot,
  "apps",
  "web",
  "src",
  "pages",
  "profile",
  "model",
  "schools.ts",
);
const refresh = process.argv.includes("--refresh");

// Вузы и организации СПО. Школы не берём: в резюме про них не спрашивают.
const classes = [
  { qid: "Q38723", title: "высшие учебные заведения" },
  { qid: "Q189004", title: "колледжи" },
  { qid: "Q7692354", title: "техникумы" },
  { qid: "Q322563", title: "профессиональные училища" },
  { qid: "Q2897316", title: "техникумы (исторические)" },
  { qid: "Q39204923", title: "техникумы (международные)" },
];

const query = (qid) => {
  return `SELECT ?item ?ru ?en WHERE {
  ?item wdt:P17 wd:Q159 ; wdt:P31/wdt:P279* wd:${qid} .
  OPTIONAL { ?item rdfs:label ?ru FILTER(LANG(?ru) = "ru") }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
}`;
};

// Сырая выгрузка лежит в ignore/ (папка не коммитится) — перезапись не трогает git.
async function loadClass({ qid, title }) {
  const file = path.join(rawDir, `wikidata-${qid}.json`);
  const cached = await readFile(file, "utf8").catch(() => null);
  if (cached && !refresh) {
    console.log(`кэш: ${title} — ${file}`);
    return JSON.parse(cached);
  }
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query(qid));
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "hh-but-it-works/build-schools (contact: repo maintainers)",
    },
  });
  if (!response.ok) {
    throw new Error(`${title}: HTTP ${response.status}`);
  }
  const text = await response.text();
  await mkdir(rawDir, { recursive: true });
  await writeFile(file, text);
  console.log(`выгрузка: ${title} — ${file}`);
  return JSON.parse(text);
}

// Wikidata в вузах держит и подразделения, и здания, и адреса — их в подсказку не надо.
// Филиалы тоже отбрасываем: человек пишет «СибГАУ», а не «Железногорский филиал СибГАУ».
const junkPattern =
  /факультет|кафедр|здание|музей|библиотек|филиал|отделение|академи[ия] наук|улица|проспект|переулок|набережная|faculty|department of|building|street|academy of sciences/i;

// Мелкий мусор, который по ключевым словам не ловится.
const denyNames = new Set([
  "Adamant Art School",
  "Armenian Drama Studio",
  "ENGECON Dubai",
  "Ostpreußische Mädchengewerbeschule",
  "ВШБ МГУ",
  "Вторая студия МХТ",
  "Клуб юных моряков (Великий Новгород)",
  "Новобиржевой Гостиный двор",
  "Пансион воспитанниц Министерства обороны Российской Федерации",
  "Санкт-Петербургский центр подготовки спасателей",
  "Театр юношеского творчества",
  "Творческая мастерская живописи",
  "ФКИ МГУ",
  "Центр оперного пения Галины Вишневской",
  "Центр эстетического воспитания «Мусейон»",
  "Юнармия",
]);

const clean = (value) => {
  return value.replace(/\s+/g, " ").trim();
};

const isJunk = (name) => {
  return junkPattern.test(name) || denyNames.has(name);
};

async function main() {
  const names = new Map();
  let enOnly = 0;
  let withoutLabel = 0;
  let junk = 0;

  for (const item of classes) {
    const data = await loadClass(item);
    for (const row of data.results.bindings) {
      const ru = row.ru?.value ? clean(row.ru.value) : "";
      const en = row.en?.value ? clean(row.en.value) : "";
      if (!ru && !en) {
        withoutLabel += 1;
        continue;
      }
      if (!ru) {
        enOnly += 1;
      }
      const name = ru || en;
      if (isJunk(name)) {
        junk += 1;
        continue;
      }
      // Английские названия держим как запасной вариант: в русскоязычной анкете они почти не помогают.
      const key = name.toLocaleLowerCase("ru");
      const known = names.get(key);
      if (!known || (known.preferred === "en" && ru)) {
        names.set(key, { name, preferred: ru ? "ru" : "en" });
      }
    }
  }

  const sorted = [...names.values()]
    .map((value) => {
      return value.name;
    })
    .sort((left, right) => {
      return left.localeCompare(right, "ru");
    });

  const lines = sorted.map((name) => {
    return `  ${JSON.stringify(name)},`;
  });
  const date = new Date().toISOString().slice(0, 10);
  const file = `// Файл сгенерирован скриптом apps/web/scripts/build-schools.mjs — правки руками сотрутся.
// Обновление: node apps/web/scripts/build-schools.mjs --refresh
//
// Источник: Wikidata, классы «вузы и организации СПО» (лицензия CC0). Дата выгрузки: ${date}.
// Официальный реестр Минобрнауки при появлении доступной выгрузки заменит этот список.

export const schoolNames: string[] = [
${lines.join("\n")}
];
`;
  await writeFile(outFile, file);
  console.log(
    `итог: ${sorted.length} названий, ${enOnly} только на английском, ${junk} мусора, ${withoutLabel} без названия`,
  );
  console.log(`записано: ${outFile}`);
}

await main();
