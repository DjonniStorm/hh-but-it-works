import type { ResumeDraft } from "@hh/contracts";
import { Grade } from "@hh/types";

import { skillCatalog } from "./skill-catalog";

type CatalogSlug = (typeof skillCatalog)[number]["slug"];

// Слово целиком: «go» не находится внутри «golang», «java» — внутри «javascript».
const boundary = String.raw`(?<![\p{L}\p{N}])`;
const end = String.raw`(?![\p{L}\p{N}])`;

function term(source: string): RegExp {
  return new RegExp(`${boundary}${source}${end}`, "iu");
}

const skillPatterns: Record<CatalogSlug, RegExp[]> = {
  postgresql: [term("postgresql"), term("postgres")],
  "http-api": [
    term(String.raw`https?(?:\s*[/:,]\s*|\s+)api`),
    term(String.raw`rest(?:\s+|-)api`),
    term("http(?!s)"),
  ],
  typescript: [term("typescript")],
  docker: [term("docker")],
  testing: [
    term("тестирование"),
    term("pytest"),
    term("jest"),
    term("testing"),
  ],
  python: [term("python")],
  csharp: [
    term(String.raw`c\s*#`),
    term(String.raw`c\s*sharp`),
    term("csharp"),
  ],
  react: [term(String.raw`react(?:\.js|js)?`)],
  go: [term("golang"), term("go")],
  java: [term("java(?!script)")],
};

const gradePattern =
  /(?<![\p{L}\p{N}])(senior|сеньор|синьор|сеньер|middle|миддл|мидл|junior|джуниор|джун)(?![\p{L}\p{N}])/iu;

const gradeByWord: Record<string, Grade> = {
  senior: Grade.Senior,
  сеньор: Grade.Senior,
  синьор: Grade.Senior,
  сеньер: Grade.Senior,
  middle: Grade.Middle,
  миддл: Grade.Middle,
  мидл: Grade.Middle,
  junior: Grade.Junior,
  джуниор: Grade.Junior,
  джун: Grade.Junior,
};

const skippedLine =
  /^(резюме|resume|cv|curriculum vitae|контакты|навыки|опыт|experience|skills|profile|профиль)$/iu;

const githubSkip = new Set([
  "about",
  "apps",
  "codespaces",
  "collections",
  "customer",
  "enterprise",
  "events",
  "explore",
  "features",
  "github",
  "issues",
  "login",
  "marketplace",
  "orgs",
  "organizations",
  "premium",
  "pricing",
  "pulls",
  "readme",
  "security",
  "settings",
  "signup",
  "site",
  "sponsors",
  "team",
  "topics",
]);

// null — в файле нет текста. Пустые поля — текст был, но анкеты в нём не нашлось.
export function draftFromText(text: string): ResumeDraft | null {
  if (text.replace(/\s+/g, "") === "") {
    return null;
  }
  return {
    displayName: displayNameFrom(text),
    experienceYears: experienceFrom(text),
    claimedGrade: gradeFrom(text),
    telegram: telegramFrom(text),
    github: githubFrom(text),
    skills: findSkills(text),
  };
}

export function findSkills(text: string): ResumeDraft["skills"] {
  const found: ResumeDraft["skills"] = [];
  for (const skill of skillCatalog) {
    const hit = skillPatterns[skill.slug].some((pattern) => {
      return pattern.test(text);
    });
    if (hit) {
      found.push({ slug: skill.slug, title: skill.title });
    }
  }
  return found;
}

function displayNameFrom(text: string): string | null {
  const lines = text.split(/\r?\n/).slice(0, 15);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || skippedLine.test(line)) {
      continue;
    }
    if (line.includes("@") || /https?:\/\//i.test(line)) {
      continue;
    }
    if (findSkills(line).length > 0) {
      continue;
    }
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 3) {
      continue;
    }
    if (gradePattern.test(line)) {
      continue;
    }
    // Имя в резюме с заглавной. Строчная строка — это предложение, не имя.
    const nameWord = /^\p{Lu}[\p{L}'’-]{0,39}$/u;
    if (
      !words.every((word) => {
        return nameWord.test(word);
      })
    ) {
      continue;
    }
    return line.slice(0, 80);
  }
  return null;
}

function gradeFrom(text: string): Grade | null {
  const match = gradePattern.exec(text);
  if (!match?.[1]) {
    return null;
  }
  return gradeByWord[match[1].toLowerCase()] ?? null;
}

function experienceFrom(text: string): number | null {
  const near = /(?:опыт|стаж|experience)[^\d]{0,30}(\d+(?:[.,]\d+)?)/iu.exec(
    text,
  );
  if (near?.[1]) {
    const value = years(near[1]);
    if (value !== null) {
      return value;
    }
  }
  const loose =
    /(\d+(?:[.,]\d+)?)\s*\+?\s*(?:года|лет|год|years|year)(?![\p{L}\p{N}])/giu;
  for (const match of text.matchAll(loose)) {
    const value = years(match[1] ?? "");
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function years(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > 40) {
    return null;
  }
  return Math.round(value * 10) / 10;
}

function telegramFrom(text: string): string | null {
  const link = /(?:t\.me|telegram\.me)\/([A-Za-z][A-Za-z0-9_]{3,31})/i.exec(
    text,
  );
  if (link?.[1]) {
    return `@${link[1]}`;
  }
  const at = /(?<![\w.])@([A-Za-z][A-Za-z0-9_]{3,31})\b/.exec(text);
  if (!at?.[1]) {
    return null;
  }
  return `@${at[1]}`;
}

function githubFrom(text: string): string | null {
  const match =
    /github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)/i.exec(text);
  if (!match?.[1] || githubSkip.has(match[1].toLowerCase())) {
    return null;
  }
  return `github.com/${match[1]}`;
}
