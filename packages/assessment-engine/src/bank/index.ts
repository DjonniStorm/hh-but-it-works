import {
  Grade,
  Specialization,
  coreSkillSlugs,
  relatedSkillSlug,
} from "@hh/types";

import type { Template } from "../types";
import { airflow } from "./airflow";
import { algorithms } from "./algorithms";
import { csharp } from "./csharp";
import { css } from "./css";
import { django } from "./django";
import { docker } from "./docker";
import { dotnet } from "./dotnet";
import { git } from "./git";
import { go } from "./go";
import { httpApi } from "./http-api";
import { java } from "./java";
import { javascript } from "./javascript";
import { kafka } from "./kafka";
import { kubernetes } from "./kubernetes";
import { linux } from "./linux";
import { nodejs } from "./nodejs";
import { owasp } from "./owasp";
import { pandas } from "./pandas";
import { postgresql } from "./postgresql";
import { python } from "./python";
import { pytorch } from "./pytorch";
import { react } from "./react";
import { redis } from "./redis";
import { spring } from "./spring";
import { sql } from "./sql";
import { systemDesign } from "./system-design";
import { testing } from "./testing";
import { typescript } from "./typescript";

const bySkill = {
  postgresql,
  sql,
  "http-api": httpApi,
  typescript,
  docker,
  testing,
  python,
  csharp,
  react,
  go,
  java,
  linux,
  redis,
  owasp,
  kafka,
  pandas,
  dotnet,
  spring,
  django,
  nodejs,
  kubernetes,
  git,
  "system-design": systemDesign,
  алгоритмы: algorithms,
  javascript,
  css,
  airflow,
  pytorch,
};

export type CatalogSlug = keyof typeof bySkill;

export const catalogSlugs = Object.keys(bySkill) as CatalogSlug[];

export function isCatalogSlug(slug: string): slug is CatalogSlug {
  return slug in bySkill;
}

// Свой банк, если он есть. Иначе вопросы родственника: NestJS отвечает как TypeScript.
export function bankSlugFor(slug: string): CatalogSlug | null {
  if (isCatalogSlug(slug)) {
    return slug;
  }
  const target = relatedSkillSlug[slug];
  if (target && isCatalogSlug(target)) {
    return target;
  }
  return null;
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
// Список общий с вебом, тип проверяет, что у каждого слага ядра есть банк.
export const coreSkills: Record<Specialization, readonly CatalogSlug[]> =
  coreSkillSlugs;
