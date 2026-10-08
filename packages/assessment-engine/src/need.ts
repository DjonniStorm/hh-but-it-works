import { Grade, Specialization } from "@hh/types";

import { type CatalogSlug, coreSkills } from "./bank";

// Как работодатели пишут навык в вакансии → навык каталога.
const aliases: Record<CatalogSlug, string[]> = {
  postgresql: ["postgresql", "postgres", "pg", "sql", "базы данных"],
  "http-api": ["http", "rest", "api", "rest api", "http api", "openapi"],
  typescript: ["typescript", "ts", "javascript", "js", "node.js", "nodejs"],
  docker: ["docker", "контейнеры", "docker compose", "kubernetes"],
  testing: ["тестирование", "testing", "jest", "vitest", "unit-тесты", "qa"],
};

export function slugForSkill(title: string): CatalogSlug | null {
  const key = title.trim().toLowerCase();
  for (const [slug, names] of Object.entries(aliases)) {
    if (names.includes(key)) {
      return slug as CatalogSlug;
    }
  }
  return null;
}

export type NeedInput = {
  specialization: Specialization;
  gradeFrom: Grade;
  mustSkills: string[];
  niceSkills: string[];
};

export type NeedPlan = {
  grade: Grade;
  slugs: CatalogSlug[];
  // Навыки вакансии, для которых в банке пока нет заданий.
  uncovered: string[];
};

// Тест под вакансию: ядро специализации плюс обязательные и желательные навыки.
export function planForNeed(need: NeedInput): NeedPlan {
  const slugs = new Set<CatalogSlug>(coreSkills[need.specialization]);
  const uncovered: string[] = [];
  for (const title of [...need.mustSkills, ...need.niceSkills]) {
    const slug = slugForSkill(title);
    if (slug) {
      slugs.add(slug);
    } else {
      uncovered.push(title);
    }
  }
  return { grade: need.gradeFrom, slugs: [...slugs], uncovered };
}
