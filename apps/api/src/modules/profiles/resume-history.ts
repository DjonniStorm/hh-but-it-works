import type { ResumeDraft } from "@hh/contracts";

import { workPeriods } from "./resume-experience";
import { type ResumeLine, Section, headingOf } from "./resume-sections";
import { degreeWords, jobWords } from "./resume-vocabulary";

type ExperienceDraft = ResumeDraft["experience"][number];
type EducationDraft = ResumeDraft["education"][number];

// Лимиты плиток анкеты: больше записей форма не сохранит.
const maxExperience = 12;
const maxEducation = 8;
const nameLimit = 80;
const summaryLimit = 280;

// «7 месяцев», «1 год 4 месяца», «(4 years 8 months)» — длительность, её hh.ru и LinkedIn печатают сами.
const durationLine =
  /^\(?\d+\s*(?:год|года|лет|месяц\p{L}*|years?|months?|yrs?|mos?)(?:\s+\d+\s*(?:месяц\p{L}*|months?|mos?))?\)?$/iu;
const bullet = /^[•·▪●\-–—*]\s*/u;
// Описание опыта: предложение с точкой или длинная строка, не название и не должность.
const sentence = /[.;!]$/u;
const longLine = 70;
const separators = /\s+[—–-]\s+|,\s+|\s+\|\s+|\s+at\s+|\s+@\s+/iu;
const levelLine =
  /^(?:высшее|неоконченное высшее|среднее(?: специальное| профессиональное)?|бакалавр|магистр|специалист|аспирантура|bachelor|master)$/iu;
const educationYears =
  /(?<!\d)((?:19|20)\d{2})(?:\s*[—–-]\s*((?:19|20)\d{2}))?(?!\d)/u;

export function experienceFrom(
  lines: ResumeLine[],
  now: Date = new Date(),
): ResumeDraft["experience"] {
  const own = sectionLines(lines, Section.Experience);
  if (own.length === 0) {
    return [];
  }
  const joined = own.join("\n");
  const starts = lineStarts(own);
  const periods = workPeriods(joined, now).map((period) => {
    return {
      ...period,
      first: lineAt(starts, period.index),
      last: lineAt(starts, period.index + period.length - 1),
    };
  });
  if (periods.length === 0) {
    return [];
  }
  // hh.ru ставит даты над записью, LinkedIn и резюме «от руки» — под названием.
  const datesFirst = periods[0]?.first === 0;
  const entries: ExperienceDraft[] = [];
  periods.forEach((period, index) => {
    const next = periods[index + 1];
    const until = next ? next.first : own.length;
    const fromYear = Math.floor(period.from / 12);
    const toYear = period.to === null ? null : Math.floor(period.to / 12);
    if (datesFirst) {
      const body = own.slice(period.last + 1, until).filter((line) => {
        return !durationLine.test(line);
      });
      entries.push({ ...datesFirstEntry(body), fromYear, toYear });
      return;
    }
    const previousEnd = index === 0 ? -1 : (periods[index - 1]?.last ?? -1);
    const header = headerLines(own, previousEnd, period.first);
    // Префикс строки с датой: «Lead Engineer, CloudCorp, Jan 2021 – Present».
    const before = joined
      .slice(starts[period.first] ?? 0, period.index)
      .replace(/[\s,|—–-]+$/u, "")
      .trim();
    if (before) {
      header.push(before);
    }
    const nextHeader = next
      ? headerLines(own, period.last, next.first).length
      : 0;
    const body = own
      .slice(period.last + 1, until - nextHeader)
      .filter((line) => {
        return !durationLine.test(line);
      });
    entries.push({
      ...companyAndRole(header),
      fromYear,
      toYear,
      summary: summaryOf(body),
    });
  });
  return entries
    .filter((entry) => {
      return entry.company !== "" || entry.role !== "";
    })
    .slice(0, maxExperience);
}

// hh.ru: компания, сайт, отрасль, должность, описание.
function datesFirstEntry(
  body: string[],
): Pick<ExperienceDraft, "company" | "role" | "summary"> {
  const company = body[0] ?? "";
  const roleIndex = body.findIndex((line, index) => {
    return index > 0 && !bullet.test(line) && jobWords.test(line);
  });
  if (roleIndex === -1) {
    return {
      company: clip(company, nameLimit),
      role: "",
      summary: summaryOf(body.slice(1)),
    };
  }
  return {
    company: clip(company, nameLimit),
    role: clip(body[roleIndex] ?? "", nameLimit),
    summary: summaryOf(body.slice(roleIndex + 1)),
  };
}

// Одна-две строки над датой. Предложение с точкой — хвост описания прошлой записи.
function headerLines(
  own: string[],
  previousEnd: number,
  first: number,
): string[] {
  const from = Math.max(previousEnd + 1, first - 2);
  const header = own.slice(from, first);
  if (header.length === 2) {
    const top = header[0] ?? "";
    if (sentence.test(top) || top.length > longLine || bullet.test(top)) {
      return header.slice(1);
    }
  }
  return header;
}

function companyAndRole(
  header: string[],
): Pick<ExperienceDraft, "company" | "role"> {
  const parts =
    header.length === 1 ? (header[0] ?? "").split(separators) : header;
  const cleaned = parts
    .map((part) => {
      return unquote(part);
    })
    .filter(Boolean);
  if (cleaned.length === 0) {
    return { company: "", role: "" };
  }
  if (cleaned.length === 1) {
    const only = cleaned[0] ?? "";
    return jobWords.test(only)
      ? { company: "", role: clip(only, nameLimit) }
      : { company: clip(only, nameLimit), role: "" };
  }
  const roleIndex = cleaned.findIndex((part) => {
    return jobWords.test(part);
  });
  // LinkedIn без слов должности: сверху компания, ниже должность.
  const role = roleIndex === -1 ? 1 : roleIndex;
  const company = role === 0 ? 1 : 0;
  return {
    company: clip(cleaned[company] ?? "", nameLimit),
    role: clip(cleaned[role] ?? "", nameLimit),
  };
}

export function educationFrom(lines: ResumeLine[]): ResumeDraft["education"] {
  const own = sectionLines(lines, Section.Education).filter((line) => {
    return !levelLine.test(line);
  });
  const entries: EducationDraft[] = [];
  let used = -1;
  for (let index = 0; index < own.length; index += 1) {
    const line = own[index] ?? "";
    const years = educationYears.exec(line);
    if (!years) {
      continue;
    }
    // Один год в hh.ru — год выпуска, начала там нет.
    const fromYear = years[2] ? Number(years[1]) : null;
    const toYear = years[2] ? Number(years[2]) : Number(years[1]);
    const rest = unquote(
      line.replace(years[0], " ").replace(/[()·]/gu, " ").replace(/\s+/gu, " "),
    );
    const parts = rest
      .split(/,\s*/u)
      .map((part) => {
        return part.trim();
      })
      .filter(Boolean);
    let school = "";
    let program = "";
    if (line.trimStart().startsWith(years[0])) {
      // hh.ru: «2019 Университет», ниже программа; или год отдельной строкой.
      let cursor = index + 1;
      school = rest;
      if (!school) {
        school = own[cursor] ?? "";
        cursor += 1;
      }
      while (cursor < own.length && isPlace(own[cursor] ?? "")) {
        cursor += 1;
      }
      const candidate = own[cursor] ?? "";
      if (candidate && !educationYears.test(candidate)) {
        program = candidate;
        used = cursor;
      }
    } else if (degreeWords.test(parts[0] ?? "")) {
      // LinkedIn: вуз строкой выше, здесь «Bachelor's degree, Программа · (2016 - 2020)».
      school = index - 1 > used ? (own[index - 1] ?? "") : "";
      program = parts.slice(1).join(", ") || (parts[0] ?? "");
    } else {
      school = parts[0] ?? "";
      program = parts.slice(1).join(", ");
    }
    used = Math.max(used, index);
    school = withoutDegree(school);
    program = withoutDegree(program);
    if (!school && !program) {
      continue;
    }
    entries.push({
      school: clip(school, nameLimit),
      program: shortProgram(program),
      fromYear,
      toYear,
    });
  }
  return entries.slice(0, maxEducation);
}

function sectionLines(lines: ResumeLine[], section: Section): string[] {
  return lines
    .filter((line) => {
      return line.section === section && !headingOf(line.text);
    })
    .map((line) => {
      return line.text;
    });
}

function lineStarts(lines: string[]): number[] {
  const starts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    starts.push(offset);
    offset += line.length + 1;
  }
  return starts;
}

function lineAt(starts: number[], offset: number): number {
  let line = 0;
  while (line + 1 < starts.length && (starts[line + 1] ?? 0) <= offset) {
    line += 1;
  }
  return line;
}

function summaryOf(body: string[]): string {
  const text = body
    .map((line) => {
      return line.replace(bullet, "").trim();
    })
    .filter(Boolean)
    .join(" ");
  return clip(text, summaryLimit);
}

// Город строкой под вузом: одно слово без запятой.
function isPlace(line: string): boolean {
  return /^[\p{Lu}][\p{L}-]+$/u.test(line);
}

function withoutDegree(value: string): string {
  return value
    .replace(new RegExp(`^(?:${degreeWords.source})\\S*\\s+`, "iu"), "")
    .replace(new RegExp(`,\\s*(?:${degreeWords.source})\\S*$`, "iu"), "")
    .replace(/[,\s]+$/u, "")
    .trim();
}

// «Факультет …, Прикладная математика»: длинную строку сокращаем до программы.
function shortProgram(program: string): string {
  if (program.length <= nameLimit || !program.includes(",")) {
    return clip(program, nameLimit);
  }
  return clip(program.split(",").pop()?.trim() ?? program, nameLimit);
}

function unquote(value: string): string {
  return value.replace(/[«»"“”]/gu, "").trim();
}

function clip(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }
  const cut = value.slice(0, limit - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > limit / 2 ? cut.slice(0, space) : cut}…`;
}
