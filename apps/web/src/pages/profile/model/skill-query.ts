import { type Specialization, skillCatalog } from "@hh/types";

export type CatalogSkill = {
  skillId: string;
  title: string;
  slug: string;
  tested: boolean;
  specializations: readonly Specialization[];
};

export type SkillGroup = {
  key: string;
  label: string;
  skills: CatalogSkill[];
};

const testedTitles = new Set(
  skillCatalog.flatMap((skill) => {
    return skill.tested ? [skill.title] : [];
  }),
);

const catalogBySlug = new Map(
  skillCatalog.map((skill) => {
    return [skill.slug, skill] as const;
  }),
);

export function skillIsTested(title: string): boolean {
  return testedTitles.has(title);
}

export function profileCatalog(
  skills: { skillId: string; slug: string; title: string }[],
): CatalogSkill[] {
  return skills.map((skill) => {
    const meta = catalogBySlug.get(skill.slug);
    return {
      skillId: skill.skillId,
      title: skill.title,
      slug: skill.slug,
      tested: meta?.tested ?? false,
      specializations: meta?.specializations ?? [],
    };
  });
}

export function availableSkills(
  catalog: CatalogSkill[],
  takenTitles: string[],
): CatalogSkill[] {
  return catalog.filter((skill) => {
    return !takenTitles.some((title) => {
      return sameTitle(title, skill.title);
    });
  });
}

export function skillKey(title: string): string {
  return title.trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
}

export function matchingSkills(
  skills: CatalogSkill[],
  query: string,
): CatalogSkill[] {
  const needle = skillKey(query);
  if (!needle) {
    return skills;
  }
  return skills.filter((skill) => {
    return skillKey(skill.title).includes(needle);
  });
}

export function sameTitle(left: string, right: string): boolean {
  const leftKey = skillKey(left);
  const rightKey = skillKey(right);
  if (!leftKey || !rightKey) {
    return false;
  }
  return leftKey.localeCompare(rightKey, "ru", { sensitivity: "accent" }) === 0;
}

export function findSkill(
  catalog: CatalogSkill[],
  query: string,
): CatalogSkill | undefined {
  return catalog.find((skill) => {
    return sameTitle(skill.title, query);
  });
}

// Своя специализация сверху. Один навык попадает только в первую подходящую группу.
export function skillGroups(
  skills: CatalogSkill[],
  specialization: Specialization | null,
  labels: Record<Specialization, string>,
): SkillGroup[] {
  const order = orderedSpecializations(skills, specialization);
  const placed = new Set<string>();
  const groups: SkillGroup[] = [];
  for (const key of order) {
    const rows = skills.filter((skill) => {
      if (placed.has(skill.skillId)) {
        return false;
      }
      return skill.specializations.includes(key);
    });
    for (const skill of rows) {
      placed.add(skill.skillId);
    }
    if (rows.length > 0) {
      groups.push({ key, label: labels[key], skills: rows });
    }
  }
  const rest = skills.filter((skill) => {
    return !placed.has(skill.skillId);
  });
  if (rest.length > 0) {
    groups.push({ key: "other", label: "Свои", skills: rest });
  }
  return groups;
}

function orderedSpecializations(
  skills: CatalogSkill[],
  specialization: Specialization | null,
): Specialization[] {
  const present = new Set<Specialization>();
  for (const skill of skills) {
    for (const item of skill.specializations) {
      present.add(item);
    }
  }
  const rest = [...present].filter((item) => {
    return item !== specialization;
  });
  if (!specialization || !present.has(specialization)) {
    return rest;
  }
  return [specialization, ...rest];
}
