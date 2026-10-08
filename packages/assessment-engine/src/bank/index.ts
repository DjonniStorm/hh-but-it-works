import { Grade, Specialization } from "@hh/types";

import type { Template } from "../types";
import { csharp } from "./csharp";
import { docker } from "./docker";
import { go } from "./go";
import { httpApi } from "./http-api";
import { java } from "./java";
import { postgresql } from "./postgresql";
import { python } from "./python";
import { react } from "./react";
import { testing } from "./testing";
import { typescript } from "./typescript";

const bySkill = {
  postgresql,
  "http-api": httpApi,
  typescript,
  docker,
  testing,
  python,
  csharp,
  react,
  go,
  java,
};

export type CatalogSlug = keyof typeof bySkill;

export const catalogSlugs = Object.keys(bySkill) as CatalogSlug[];

export function isCatalogSlug(slug: string): slug is CatalogSlug {
  return slug in bySkill;
}

// Банк в разрезе навык × грейд: из ячейки попытка берёт задания секции.
export const bank: Record<
  CatalogSlug,
  Record<Grade, Template[]>
> = Object.fromEntries(
  catalogSlugs.map((slug) => {
    const templates = bySkill[slug];
    const cell = (grade: Grade) => {
      return templates.filter((template) => {
        return template.grades.includes(grade);
      });
    };
    return [
      slug,
      {
        [Grade.Junior]: cell(Grade.Junior),
        [Grade.Middle]: cell(Grade.Middle),
        [Grade.Senior]: cell(Grade.Senior),
      },
    ];
  }),
) as Record<CatalogSlug, Record<Grade, Template[]>>;

// Ядро специализации входит в каждую попытку, даже если навыка нет в анкете.
export const coreSkills: Record<Specialization, CatalogSlug[]> = {
  [Specialization.Backend]: ["http-api", "postgresql"],
  [Specialization.Frontend]: ["typescript", "http-api"],
  [Specialization.Data]: ["postgresql"],
  [Specialization.Security]: ["http-api", "docker"],
};
