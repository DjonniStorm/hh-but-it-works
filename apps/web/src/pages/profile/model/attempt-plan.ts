import {
  type SkillLevel,
  type SkillVerification,
  Specialization,
  relatedSkillSlug,
  skillCatalog,
} from "@hh/types";

// Как coreSkills в пакете тестов. Веб пакет не импортирует: в нём ключи ответов.
const coreSlugs: Record<Specialization, readonly string[]> = {
  [Specialization.Backend]: ["http-api", "postgresql"],
  [Specialization.Frontend]: ["typescript", "http-api"],
  [Specialization.Data]: ["postgresql"],
  [Specialization.Security]: ["http-api", "docker"],
};

const bySlug = new Map(
  skillCatalog.map((skill) => {
    return [skill.slug, skill] as const;
  }),
);

export type PlanSkill = {
  slug: string;
  title: string;
  level: SkillLevel | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
};

export type PlannedSection = {
  key: string;
  title: string;
  detail: string | null;
  level: SkillLevel | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
  inProfile: boolean;
};

type Bucket = {
  bankSlug: string;
  title: string;
  native: boolean;
  skill: PlanSkill | null;
  also: string[];
};

// Свой банк, если он есть. Иначе вопросы родственника из relatedSkillSlug.
export function bankSlugForSkill(slug: string): string | null {
  const item = bySlug.get(slug);
  if (item?.tested) {
    return slug;
  }
  const target = relatedSkillSlug[slug];
  if (target && bySlug.get(target)?.tested) {
    return target;
  }
  return null;
}

export function skillCanBeTested(slug: string): boolean {
  return bankSlugForSkill(slug) !== null;
}

export function sectionIsCore(
  specialization: Specialization | null,
  bankSlug: string,
): boolean {
  if (!specialization) {
    return false;
  }
  return coreSlugs[specialization].includes(bankSlug);
}

export function attemptPlan(
  specialization: Specialization | null,
  skills: readonly PlanSkill[],
): { sections: PlannedSection[]; untested: { slug: string; title: string }[] } {
  if (!specialization) {
    return { sections: [], untested: [] };
  }
  const buckets = new Map<string, Bucket>();
  const consider = (
    slug: string,
    title: string,
    skill: PlanSkill | null,
  ): boolean => {
    const bankSlug = bankSlugForSkill(slug);
    if (!bankSlug) {
      return false;
    }
    const native = slug === bankSlug;
    const current = buckets.get(bankSlug);
    if (!current) {
      buckets.set(bankSlug, { bankSlug, title, native, skill, also: [] });
      return true;
    }
    if (native && !current.native) {
      current.also.push(current.title);
      current.title = title;
      current.native = true;
      current.skill = skill;
      return true;
    }
    if (!native) {
      current.also.push(title);
      return true;
    }
    if (skill && !current.skill) {
      current.skill = skill;
    }
    return true;
  };

  for (const slug of coreSlugs[specialization]) {
    const item = bySlug.get(slug);
    consider(slug, item?.title ?? slug, null);
  }
  const untested: { slug: string; title: string }[] = [];
  const ordered = skills
    .filter((skill) => {
      return skill.level;
    })
    .sort((left, right) => {
      return left.title.localeCompare(right.title, "ru");
    });
  for (const skill of ordered) {
    if (!consider(skill.slug, skill.title, skill)) {
      untested.push({ slug: skill.slug, title: skill.title });
    }
  }
  const coreOrder = new Map(
    coreSlugs[specialization].map((slug, index) => {
      return [slug, index] as const;
    }),
  );
  const sections = [...buckets.values()]
    .sort((left, right) => {
      const leftCore = coreOrder.get(left.bankSlug);
      const rightCore = coreOrder.get(right.bankSlug);
      if (leftCore !== undefined && rightCore !== undefined) {
        return leftCore - rightCore;
      }
      if (leftCore !== undefined) {
        return -1;
      }
      if (rightCore !== undefined) {
        return 1;
      }
      return left.title.localeCompare(right.title, "ru");
    })
    .map((bucket) => {
      return {
        key: bucket.bankSlug,
        title: bucket.title,
        detail: sectionDetail(bucket),
        level: bucket.skill?.level ?? null,
        verification: bucket.skill?.verification ?? null,
        verifiedAt: bucket.skill?.verifiedAt ?? null,
        inProfile: Boolean(bucket.skill),
      };
    });
  return { sections, untested };
}

function sectionDetail(bucket: Bucket): string | null {
  const via = bySlug.get(bucket.bankSlug)?.title ?? bucket.bankSlug;
  const extra = alsoClause(bucket.also);
  if (!bucket.native) {
    if (!extra) {
      return `вопросы по ${via}`;
    }
    return `вопросы по ${via}, ${extra}`;
  }
  if (!extra) {
    return null;
  }
  return `этой секцией ${extra}`;
}

function alsoClause(titles: string[]): string | null {
  if (titles.length === 0) {
    return null;
  }
  if (titles.length === 1) {
    return `также проверяется ${titles[0]}`;
  }
  return `также проверяются ${joinTitles(titles)}`;
}

function joinTitles(titles: string[]): string {
  const head = titles.slice(0, -1).join(", ");
  return `${head} и ${titles[titles.length - 1]}`;
}
