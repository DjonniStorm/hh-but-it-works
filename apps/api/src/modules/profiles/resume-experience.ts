// Стаж из резюме. Месяцы считаются от нуля: январь 2020 — 2020 * 12.

const monthStems: [RegExp, number][] = [
  [/^(янв|jan)/, 0],
  [/^(фев|feb)/, 1],
  [/^(мар|mar)/, 2],
  [/^(апр|apr)/, 3],
  [/^(ма[йя]|may)/, 4],
  [/^(июн|jun)/, 5],
  [/^(июл|jul)/, 6],
  [/^(авг|aug)/, 7],
  [/^(сен|sep)/, 8],
  [/^(окт|oct)/, 9],
  [/^(ноя|nov)/, 10],
  [/^(дек|dec)/, 11],
];

const monthWord = String.raw`[A-Za-zА-Яа-яЁё]{3,9}\.?`;
const point = String.raw`(?:${monthWord}\s+\d{4}|\d{1,2}[./]\d{4}|\d{4})`;
const ongoing = String.raw`(?:по\s+)?(?:настоящее\s+время|н\.\s?в\.?|наст\.\s?вр\.?|сейчас|present|now|current)`;
// Дата и дефис могут стоять на разных строках: hh.ru переносит «Январь 2020 —» и «настоящее время».
const range = new RegExp(
  String.raw`(?<![\p{L}\p{N}])(${point})\s*(?:[—–-]|по|to|until)\s*(${point}|${ongoing})`,
  "giu",
);

// «Опыт работы — 6 лет 8 месяцев» hh.ru считает сам, пересечения он уже учёл.
const hhTotal =
  /опыт работы\s*[—–-]\s*(?:(\d+)\s*(?:года|год|лет))?\s*(?:(\d+)\s*месяц\p{L}*)?/iu;

const statedYears =
  /(\d+(?:[.,]\d+)?)\s*\+?\s*(?:года|лет|год|years?)\s+(?:опыта|коммерческого опыта|of\s+(?:\p{L}+\s+)?experience)/iu;
const statedAfter =
  /(?:опыт(?:\s+работы)?|стаж|experience)\s*(?:[:—–-]|более|свыше|over)?\s*(\d+(?:[.,]\d+)?)\s*\+?\s*(?:года|лет|год|years?)/iu;

export function experienceYears(
  wholeText: string,
  experienceText: string,
  now: Date = new Date(),
): number | null {
  const total = hhTotal.exec(wholeText);
  if (total && (total[1] || total[2])) {
    return rounded(Number(total[1] ?? 0) + Number(total[2] ?? 0) / 12);
  }
  const months = monthsOfRanges(experienceText, now);
  if (months > 0) {
    return rounded(months / 12);
  }
  const stated = statedYears.exec(wholeText) ?? statedAfter.exec(wholeText);
  if (stated?.[1]) {
    return rounded(Number(stated[1].replace(",", ".")));
  }
  return null;
}

// Сумма периодов работы. Совместительство в одни и те же месяцы считается один раз.
export function monthsOfRanges(text: string, now: Date): number {
  const current = now.getFullYear() * 12 + now.getMonth();
  const spans: [number, number][] = [];
  for (const match of text.matchAll(range)) {
    const start = monthOf(match[1] ?? "", false);
    const end = new RegExp(`^${ongoing}$`, "iu").test(match[2] ?? "")
      ? current
      : monthOf(match[2] ?? "", true);
    if (start === null || end === null || end < start || end > current + 1) {
      continue;
    }
    // Нижняя граница: даты в резюме раньше 1970 года — это не стаж.
    if (start < 1970 * 12) {
      continue;
    }
    spans.push([start, Math.min(end, current)]);
  }
  spans.sort((left, right) => {
    return left[0] - right[0];
  });
  let months = 0;
  let open: [number, number] | null = null;
  for (const span of spans) {
    if (open && span[0] <= open[1] + 1) {
      open[1] = Math.max(open[1], span[1]);
      continue;
    }
    if (open) {
      months += open[1] - open[0] + 1;
    }
    open = [span[0], span[1]];
  }
  if (open) {
    months += open[1] - open[0] + 1;
  }
  return months;
}

// Год без месяца: начало периода — январь, конец — декабрь.
function monthOf(raw: string, isEnd: boolean): number | null {
  const value = raw.trim().toLowerCase();
  const numeric = /^(\d{1,2})[./](\d{4})$/.exec(value);
  if (numeric) {
    const month = Number(numeric[1]) - 1;
    if (month < 0 || month > 11) {
      return null;
    }
    return Number(numeric[2]) * 12 + month;
  }
  const yearOnly = /^(\d{4})$/.exec(value);
  if (yearOnly) {
    return Number(yearOnly[1]) * 12 + (isEnd ? 11 : 0);
  }
  const named = /^(\S+)\s+(\d{4})$/u.exec(value);
  if (!named) {
    return null;
  }
  const word = named[1] ?? "";
  const month = monthStems.find(([stem]) => {
    return stem.test(word);
  });
  if (!month) {
    return null;
  }
  return Number(named[2]) * 12 + month[1];
}

function rounded(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > 40) {
    return null;
  }
  return Math.round(value * 10) / 10;
}
