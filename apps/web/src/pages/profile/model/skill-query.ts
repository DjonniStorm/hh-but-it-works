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

export function matchingSkills(
  skills: CatalogSkill[],
  query: string,
): CatalogSkill[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return skills;
  }
  return skills.filter((skill) => {
    return skill.title.toLowerCase().includes(needle);
  });
}

export function sameTitle(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
