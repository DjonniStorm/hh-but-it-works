import type { ResumeDraft } from "@hh/contracts";
import { Grade, SearchStatus, Specialization, WorkFormat } from "@hh/types";

import { experienceYears } from "./resume-experience";
import {
  type ResumeLine,
  Section,
  headingOf,
  splitResume,
  textOf,
} from "./resume-sections";
import { type CatalogSkill, findSkills } from "./resume-skills";
import {
  activeSearch,
  gradeGoal,
  gradeWords,
  roleLine,
  softSkillWords,
  specializationWords,
  workFormatLine,
  workFormatWords,
} from "./resume-vocabulary";

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

// Ссылки на эти сайты — не личный сайт кандидата.
const notWebsite =
  /(?:github\.com|linkedin\.com|t\.me|telegram\.me|hh\.ru|vk\.com|habr\.com|youtube\.com|example\.com)/i;

// Шапка: имя, должность, контакты. Дальше 8 строк грейд и роль уже не ищем.
const headerSize = 8;
// Должность под именем: у LinkedIn имя стоит после боковой колонки, не в начале файла.
const linesUnderName = 3;
const minOwnSkills = 5;

// null — в файле нет текста. Пустые поля — текст был, но анкеты в нём не нашлось.
export function draftFromText(
  raw: string,
  catalog: CatalogSkill[] = [],
): ResumeDraft | null {
  if (raw.replace(/\s+/g, "") === "") {
    return null;
  }
  const lines = splitResume(raw);
  const whole = textOf(lines, ...Object.values(Section));
  return {
    displayName: displayNameFrom(lines),
    specialization: specializationFrom(lines),
    experienceYears: experienceYears(whole, textOf(lines, Section.Experience)),
    claimedGrade: gradeFrom(lines),
    email: emailFrom(whole),
    phone: phoneFrom(whole),
    telegram: telegramFrom(whole),
    github: githubFrom(whole),
    linkedin: linkedinFrom(whole),
    website: websiteFrom(lines),
    desiredSalaryFrom: salaryFrom(lines),
    workFormats: workFormatsFrom(lines),
    searchStatus: activeSearch.test(whole)
      ? SearchStatus.ActivelyLooking
      : null,
    skills: findSkills(skillText(lines, whole), catalog),
    softSkills: softSkillsFrom(lines, whole),
  };
}

// Полный раздел навыков — опыт не смотрим: там стек прошлых проектов и чужих команд.
// У LinkedIn в «Top Skills» всего три навыка, остальное только в опыте.
function skillText(lines: ResumeLine[], whole: string): string {
  const own = textOf(lines, Section.Skills);
  if (findSkills(own).length < minOwnSkills) {
    return whole;
  }
  return textOf(
    lines,
    Section.Header,
    Section.Desired,
    Section.Skills,
    Section.About,
  );
}

function softSkillsFrom(lines: ResumeLine[], whole: string): string[] {
  const own = textOf(lines, Section.Skills, Section.About);
  const source = own || whole;
  return softSkillWords
    .filter(([pattern]) => {
      return pattern.test(source);
    })
    .map(([, title]) => {
      return title;
    });
}

function titleLines(lines: ResumeLine[]): ResumeLine[] {
  const name = nameIndex(lines);
  return lines.filter((line, index) => {
    return (
      (index < headerSize && line.section === Section.Header) ||
      (name !== -1 && index > name && index <= name + linesUnderName) ||
      line.section === Section.Desired
    );
  });
}

function specializationFrom(lines: ResumeLine[]): Specialization | null {
  const score = new Map<Specialization, number>();
  const title = new Set(titleLines(lines));
  for (const line of lines) {
    if (
      line.section !== Section.Experience &&
      line.section !== Section.About &&
      !title.has(line)
    ) {
      continue;
    }
    // Желаемая должность весит втрое больше упоминаний в опыте.
    const weight = title.has(line) ? 3 : 1;
    for (const [specialization, pattern] of Object.entries(
      specializationWords,
    )) {
      const hits =
        line.text.match(new RegExp(pattern.source, "giu"))?.length ?? 0;
      const key = specialization as Specialization;
      score.set(key, (score.get(key) ?? 0) + hits * weight);
    }
  }
  const ranked = [...score.entries()].sort((left, right) => {
    return right[1] - left[1];
  });
  const [best, second] = ranked;
  if (!best || best[1] === 0 || best[1] === second?.[1]) {
    return null;
  }
  return best[0];
}

// Грейд со строки должности: сначала желаемая, потом последняя работа, потом «О себе».
function gradeFrom(lines: ResumeLine[]): Grade | null {
  const lastJob = lines.find((line) => {
    return line.section === Section.Experience && roleLine.test(line.text);
  });
  const ordered = [
    ...titleLines(lines),
    ...(lastJob ? [lastJob] : []),
    ...lines.filter((line) => {
      return line.section === Section.About;
    }),
  ];
  for (const line of ordered) {
    if (!roleLine.test(line.text)) {
      continue;
    }
    const grade = gradeOfLine(line.text);
    if (grade) {
      return grade;
    }
  }
  return null;
}

function gradeOfLine(text: string): Grade | null {
  let first: { index: number; grade: Grade } | null = null;
  for (const [pattern, grade] of gradeWords) {
    for (const match of text.matchAll(new RegExp(pattern.source, "giu"))) {
      const index = match.index ?? 0;
      if (gradeGoal.test(text.slice(Math.max(0, index - 30), index))) {
        continue;
      }
      if (!first || index < first.index) {
        first = { index, grade };
      }
      break;
    }
  }
  return first?.grade ?? null;
}

const nameWord = /^\p{Lu}[\p{L}'’-]{0,39}$/u;

function displayNameFrom(lines: ResumeLine[]): string | null {
  const index = nameIndex(lines);
  if (index === -1) {
    return null;
  }
  return (lines[index]?.text ?? "")
    .split(" ")
    .map(nameCase)
    .join(" ")
    .slice(0, 80);
}

function nameIndex(lines: ResumeLine[]): number {
  return lines.slice(0, 25).findIndex((line) => {
    return isName(line);
  });
}

function isName(line: ResumeLine): boolean {
  const text = line.text;
  if (headingOf(text) || line.section === Section.Skills) {
    return false;
  }
  if (/[@\d/:|•·(),]/.test(text)) {
    return false;
  }
  if (findSkills(text).length > 0 || roleLine.test(text)) {
    return false;
  }
  const words = text.split(" ");
  if (words.length < 2 || words.length > 3) {
    return false;
  }
  return words.map(nameCase).every((word) => {
    return nameWord.test(word);
  });
}

// «DAVID PETROV» — так пишут имя в шапке, в анкету оно идёт как «David Petrov».
function nameCase(word: string): string {
  if (word.length > 1 && word === word.toUpperCase()) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  return word;
}

function emailFrom(text: string): string | null {
  const match = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/i.exec(text);
  return match ? match[0].toLowerCase() : null;
}

function phoneFrom(text: string): string | null {
  const match =
    /(?<![\d])(?:\+7|8|7)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}(?!\d)|\+\d{1,3}[\s(-]*\d{2,4}[\s)-]*\d{3}[\s-]*\d{2,4}[\s-]*\d{0,4}(?!\d)/.exec(
      text,
    );
  if (!match) {
    return null;
  }
  const digits = match[0].replace(/\D/g, "");
  // Российский номер приводим к одному виду, остальные оставляем как в резюме.
  if (digits.length === 11 && /^[78]/.test(digits)) {
    const d = digits.slice(1);
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
  }
  return match[0].trim();
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

function linkedinFrom(text: string): string | null {
  // LinkedIn переносит длинную ссылку по дефису на следующую строку.
  const joined = text.replace(/(linkedin\.com\/in\/[\w-]*-)\n/gi, "$1");
  const match = /linkedin\.com\/in\/([\w-]{3,100})/i.exec(joined);
  if (!match?.[1]) {
    return null;
  }
  return `linkedin.com/in/${match[1]}`;
}

function websiteFrom(lines: ResumeLine[]): string | null {
  const text = textOf(lines, Section.Header, Section.Contacts, Section.About);
  for (const match of text.matchAll(/(?:https?:\/\/|www\.)[^\s,;|]+/gi)) {
    const url = match[0].replace(/[.)]+$/, "");
    if (notWebsite.test(url)) {
      continue;
    }
    return url.slice(0, 120);
  }
  return null;
}

function salaryFrom(lines: ResumeLine[]): number | null {
  const text = textOf(lines, Section.Desired);
  const match = /(\d[\d\s  ]{2,})\s*(?:₽|руб|rub|р\.)/iu.exec(text);
  if (!match?.[1]) {
    return null;
  }
  const value = Number(match[1].replace(/\D/g, ""));
  if (!Number.isInteger(value) || value < 1000) {
    return null;
  }
  return value;
}

function workFormatsFrom(lines: ResumeLine[]): WorkFormat[] {
  const source = lines
    .filter((line) => {
      return workFormatLine.test(line.text) || line.section === Section.Desired;
    })
    .filter((line) => {
      // В желаемой должности учитываем только строки-перечисления, не название позиции.
      return workFormatLine.test(line.text) || !roleLine.test(line.text);
    })
    .map((line) => {
      return line.text;
    })
    .join("\n");
  return workFormatWords
    .filter(([pattern]) => {
      return pattern.test(source);
    })
    .map(([, format]) => {
      return format;
    });
}
