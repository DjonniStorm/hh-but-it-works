export type CatalogSkill = {
  skillId: string;
  title: string;
};

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
