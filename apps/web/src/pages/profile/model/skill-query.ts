import { Specialization, skillCatalog } from "@hh/types";

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

const groupOrder: readonly string[] = [
  ...Object.values(Specialization),
  "other",
];

// Своя специализация сверху. Навык из нескольких специализаций попадает в свою, иначе в первую.
export function skillGroups(
  skills: CatalogSkill[],
  specialization: Specialization | null,
  labels: Record<Specialization, string>,
): SkillGroup[] {
  const byKey = new Map<string, CatalogSkill[]>();
  for (const skill of skills) {
    const key = skillGroupKey(skill, specialization);
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(skill);
    } else {
      byKey.set(key, [skill]);
    }
  }
  const order = specialization
    ? [specialization, ...groupOrder.filter((key) => key !== specialization)]
    : groupOrder;
  return order.flatMap((key) => {
    const rows = byKey.get(key);
    if (!rows) {
      return [];
    }
    return [
      {
        key,
        label: key === "other" ? "Свои" : labels[key as Specialization],
        skills: rows,
      },
    ];
  });
}

function skillGroupKey(
  skill: CatalogSkill,
  specialization: Specialization | null,
): string {
  if (specialization && skill.specializations.includes(specialization)) {
    return specialization;
  }
  return skill.specializations[0] ?? "other";
}
