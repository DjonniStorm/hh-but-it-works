export enum Section {
  Header = "header",
  Desired = "desired",
  Experience = "experience",
  Education = "education",
  Skills = "skills",
  About = "about",
  Contacts = "contacts",
  Languages = "languages",
  Other = "other",
}

export type ResumeLine = { text: string; section: Section };

// Заголовки hh.ru, LinkedIn и резюме «от руки». Сравниваются со строкой целиком.
const headings: Record<Exclude<Section, Section.Header>, string[]> = {
  [Section.Desired]: [
    "желаемая должность и зарплата",
    "желаемая должность",
    "желаемая позиция",
    "цель",
    "objective",
    "desired position",
  ],
  [Section.Experience]: [
    "опыт работы",
    "опыт",
    "трудовой опыт",
    "места работы",
    "experience",
    "work experience",
    "professional experience",
    "employment history",
  ],
  [Section.Education]: [
    "образование",
    "повышение квалификации, курсы",
    "курсы",
    "сертификаты",
    "электронные сертификаты",
    "тесты, экзамены",
    "education",
    "courses",
    "certifications",
    "licenses & certifications",
  ],
  [Section.Skills]: [
    "навыки",
    "ключевые навыки",
    "профессиональные навыки",
    "технические навыки",
    "стек",
    "технологии",
    "skills",
    "top skills",
    "key skills",
    "technical skills",
    "hard skills",
    "soft skills",
    "личные качества",
  ],
  [Section.About]: [
    "о себе",
    "обо мне",
    "дополнительная информация",
    "профиль",
    "summary",
    "about",
    "about me",
    "profile",
    "additional information",
  ],
  [Section.Contacts]: [
    "контакты",
    "контактная информация",
    "contact",
    "contacts",
  ],
  [Section.Languages]: ["языки", "знание языков", "languages"],
  [Section.Other]: ["проекты", "рекомендации", "projects", "recommendations"],
};

const sectionByHeading = new Map<string, Section>();
for (const [section, titles] of Object.entries(headings)) {
  for (const title of titles) {
    sectionByHeading.set(title, section as Section);
  }
}

// Колонтитул hh.ru повторяется на каждой странице и рвёт секцию посередине.
const footer = /резюме обновлено \d/iu;

export function headingOf(line: string): Section | null {
  const key = line
    .toLowerCase()
    .replace(/ё/g, "е")
    // «Опыт работы — 1 год 8 месяцев»: заголовок hh.ru вместе с итогом стажа.
    .replace(/\s+[—–-]\s+.*$/u, "")
    .replace(/[:.]\s*$/u, "")
    .trim();
  return sectionByHeading.get(key) ?? null;
}

export function splitResume(text: string): ResumeLine[] {
  const lines: ResumeLine[] = [];
  let section = Section.Header;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line || footer.test(line)) {
      continue;
    }
    const heading = headingOf(line);
    if (heading) {
      section = heading;
    }
    lines.push({ text: line, section });
  }
  return lines;
}

export function textOf(lines: ResumeLine[], ...sections: Section[]): string {
  return lines
    .filter((line) => {
      return sections.includes(line.section);
    })
    .map((line) => {
      return line.text;
    })
    .join("\n");
}
