import type { CandidateProfile } from "@hh/contracts";
import { SkillVerification } from "@hh/types";

export type MaterialLink = {
  label: string;
  url: string;
};

export type SkillMaterials = {
  skillId: string;
  title: string;
  verification: SkillVerification;
  links: MaterialLink[];
};

// Локальный каталог материалов по слагам навыков. Пока живёт здесь: когда бэк
// отдаст ссылки ручкой, меняем только источник, карточки не трогаем.
const materialsBySlug: Record<string, MaterialLink[]> = {
  postgresql: [
    {
      label: "Документация PostgreSQL",
      url: "https://www.postgresql.org/docs/current/",
    },
    {
      label: "PostgreSQL Tutorial",
      url: "https://www.postgresqltutorial.com/",
    },
    { label: "Use the Index, Luke", url: "https://use-the-index-luke.com/" },
  ],
  "http-api": [
    {
      label: "MDN: HTTP",
      url: "https://developer.mozilla.org/ru/docs/Web/HTTP",
    },
    {
      label: "RFC 9110: HTTP Semantics",
      url: "https://www.rfc-editor.org/rfc/rfc9110.html",
    },
    {
      label: "Google: API Design Guide",
      url: "https://cloud.google.com/apis/design",
    },
  ],
  typescript: [
    {
      label: "TypeScript Handbook",
      url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    },
    {
      label: "TypeScript Deep Dive",
      url: "https://basarat.gitbook.io/typescript/",
    },
  ],
  docker: [
    { label: "Документация Docker", url: "https://docs.docker.com/" },
    { label: "Docker Compose", url: "https://docs.docker.com/compose/" },
    {
      label: "Best practices для сборки образов",
      url: "https://docs.docker.com/build/building/best-practices/",
    },
  ],
  testing: [
    {
      label: "Practical Test Pyramid",
      url: "https://martinfowler.com/articles/practical-test-pyramid.html",
    },
    {
      label: "Jest: Getting Started",
      url: "https://jestjs.io/docs/getting-started",
    },
    { label: "Testing Library Docs", url: "https://testing-library.com/docs/" },
  ],
  python: [
    { label: "Python Tutorial", url: "https://docs.python.org/3/tutorial/" },
    { label: "PEP 8 — стиль кода", url: "https://peps.python.org/pep-0008/" },
    { label: "Real Python", url: "https://realpython.com/" },
  ],
  csharp: [
    {
      label: "Microsoft Learn: C#",
      url: "https://learn.microsoft.com/ru-ru/dotnet/csharp/",
    },
    {
      label: "C# language reference",
      url: "https://learn.microsoft.com/ru-ru/dotnet/csharp/language-reference/",
    },
    {
      label: "Tour of C#",
      url: "https://learn.microsoft.com/ru-ru/dotnet/csharp/tour-of-csharp/",
    },
  ],
  react: [
    { label: "React: Learn", url: "https://react.dev/learn" },
    { label: "React: Reference", url: "https://react.dev/reference/react" },
    {
      label: "Thinking in React",
      url: "https://react.dev/thinking-in-react",
    },
  ],
  go: [
    { label: "Документация Go", url: "https://go.dev/doc/" },
    { label: "Effective Go", url: "https://go.dev/doc/effective_go" },
    { label: "Go by Example", url: "https://gobyexample.com/" },
  ],
  java: [
    {
      label: "Java Tutorials",
      url: "https://docs.oracle.com/javase/tutorial/",
    },
    { label: "dev.java: Learn", url: "https://dev.java/learn/" },
    {
      label: "Java Language Specification",
      url: "https://docs.oracle.com/javase/specs/jls/se21/html/index.html",
    },
  ],
  javascript: [
    {
      label: "MDN: Руководство по JavaScript",
      url: "https://developer.mozilla.org/ru/docs/Web/JavaScript/Guide",
    },
    { label: "Learn JavaScript", url: "https://learn-javascript.ru/" },
    { label: "Спецификация ECMA-262", url: "https://tc39.es/ecma262/" },
  ],
  git: [
    { label: "Pro Git Book", url: "https://git-scm.com/book/ru/v2" },
    {
      label: "Learn Git Branching",
      url: "https://learngitbranching.js.org/?locale=ru",
    },
    { label: "Git Reference", url: "https://git-scm.com/docs" },
  ],
};

// Навык подтверждён, если он прошёл тест или пришёл из внешнего реестра.
export function isConfirmedSkill(skill: {
  verification: SkillVerification | null;
}): boolean {
  return (
    skill.verification === SkillVerification.Verified ||
    skill.verification === SkillVerification.VerifiedExternal
  );
}

// Материалы только по подтверждённым навыкам: неподтверждённые темы кандидат
// вряд ли готовит, а навыки вне каталога пока пропускаем.
export function materialsFor(
  profile: CandidateProfile | null,
): SkillMaterials[] {
  const skills = profile?.skills ?? [];
  const result: SkillMaterials[] = [];
  for (const skill of skills) {
    const links = materialsBySlug[skill.slug];
    if (!isConfirmedSkill(skill) || !links) {
      continue;
    }
    result.push({
      skillId: skill.skillId,
      title: skill.title,
      verification: skill.verification ?? SkillVerification.Unverified,
      links,
    });
  }
  return result;
}

// Поиск по названию навыка и по названиям ссылок: регистр и пробелы не мешают.
export function filterMaterials(
  cards: SkillMaterials[],
  query: string,
): SkillMaterials[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return cards;
  }
  return cards.filter((card) => {
    return (
      card.title.toLowerCase().includes(needle) ||
      card.links.some((link) => {
        return link.label.toLowerCase().includes(needle);
      })
    );
  });
}
