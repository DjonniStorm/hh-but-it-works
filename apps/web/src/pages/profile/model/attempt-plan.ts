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
  level: SkillLevel | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
  inProfile: boolean;
};

export type ProxySkill = {
  slug: string;
  title: string;
  via: string;
};

type Bucket = {
  bankSlug: string;
  title: string;
  skill: PlanSkill | null;
};

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
): {
  sections: PlannedSection[];
  proxies: ProxySkill[];
  untested: { slug: string; title: string }[];
} {
  if (!specialization) {
    return { sections: [], proxies: [], untested: [] };
  }
  const buckets = new Map<string, Bucket>();
  const ensure = (slug: string, skill: PlanSkill | null) => {
    const title = bySlug.get(slug)?.title ?? slug;
    const current = buckets.get(slug);
    if (!current) {
      buckets.set(slug, { bankSlug: slug, title, skill });
      return;
    }
    if (skill && !current.skill) {
      current.skill = skill;
    }
  };

  for (const slug of coreSlugs[specialization]) {
    ensure(slug, null);
  }
  const proxies: ProxySkill[] = [];
  const untested: { slug: string; title: string }[] = [];
  const ordered = skills
    .filter((skill) => {
      return skill.level;
    })
    .sort((left, right) => {
      return left.title.localeCompare(right.title, "ru");
    });
  for (const skill of ordered) {
    const meta = bySlug.get(skill.slug);
    if (meta?.tested) {
      ensure(skill.slug, skill);
      continue;
    }
    const via = relatedSkillSlug[skill.slug];
    const viaTitle = via ? bySlug.get(via)?.title : undefined;
    if (via && bySlug.get(via)?.tested && viaTitle) {
      ensure(via, null);
      proxies.push({ slug: skill.slug, title: skill.title, via: viaTitle });
      continue;
    }
    untested.push({ slug: skill.slug, title: skill.title });
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
        level: bucket.skill?.level ?? null,
        verification: bucket.skill?.verification ?? null,
        verifiedAt: bucket.skill?.verifiedAt ?? null,
        inProfile: Boolean(bucket.skill),
      };
    });
  return { sections, proxies, untested };
}
