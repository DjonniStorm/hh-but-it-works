import {
  type SkillLevel,
  type SkillVerification,
  Specialization,
  coreSkillSlugs,
  relatedSkillSlug,
  skillCatalog,
} from "@hh/types";

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

// Секция — банк вопросов. Результат секции получает только навык банка.
export type PlannedSection = {
  key: string;
  title: string;
  level: SkillLevel | null;
  verification: SkillVerification | null;
  verifiedAt: string | null;
  inProfile: boolean;
};

// Навык анкеты без своего банка: вопросы берутся у родственника, сам навык остаётся заявленным.
export type RelatedSkill = {
  slug: string;
  title: string;
  bankTitle: string;
  bankInProfile: boolean;
};

export type AttemptPlan = {
  sections: PlannedSection[];
  related: RelatedSkill[];
  untested: { slug: string; title: string }[];
};

function coreOf(specialization: Specialization): readonly string[] {
  return coreSkillSlugs[specialization];
}

function titleOf(slug: string): string {
  return bySlug.get(slug)?.title ?? slug;
}

// Как bankSlugFor в пакете тестов: свой банк или банк родственника из relatedSkillSlug.
function bankSlugForSkill(slug: string): string | null {
  if (bySlug.get(slug)?.tested) {
    return slug;
  }
  const target = relatedSkillSlug[slug];
  if (target && bySlug.get(target)?.tested) {
    return target;
  }
  return null;
}

export function sectionIsCore(
  specialization: Specialization | null,
  bankSlug: string,
): boolean {
  if (!specialization) {
    return false;
  }
  return coreOf(specialization).includes(bankSlug);
}

export function relatedNote(skill: RelatedSkill): string {
  const intro = `${skill.title} — своих вопросов нет, проверим ${skill.bankTitle}.`;
  if (skill.bankInProfile) {
    return `${intro} Результат получит ${skill.bankTitle}, ${skill.title} останется заявленным`;
  }
  return `${intro} Если сдадите, ${skill.bankTitle} добавится в анкету подтверждённым, ${skill.title} останется заявленным`;
}

// Те же секции, что соберёт API: банки ядра и банки навыков анкеты.
export function attemptPlan(
  specialization: Specialization | null,
  skills: readonly PlanSkill[],
): AttemptPlan {
  if (!specialization) {
    return { sections: [], related: [], untested: [] };
  }
  const own = skills
    .filter((skill) => {
      return skill.level;
    })
    .sort((left, right) => {
      return left.title.localeCompare(right.title, "ru");
    });
  const ownBySlug = new Map(
    own.map((skill) => {
      return [skill.slug, skill] as const;
    }),
  );
  const core = coreOf(specialization);
  const banks = new Set<string>(core);
  const related: RelatedSkill[] = [];
  const untested: { slug: string; title: string }[] = [];
  for (const skill of own) {
    const bankSlug = bankSlugForSkill(skill.slug);
    if (!bankSlug) {
      untested.push({ slug: skill.slug, title: skill.title });
      continue;
    }
    banks.add(bankSlug);
    if (bankSlug !== skill.slug) {
      related.push({
        slug: skill.slug,
        title: skill.title,
        bankTitle: titleOf(bankSlug),
        bankInProfile: ownBySlug.has(bankSlug),
      });
    }
  }
  const sections = [...banks]
    .sort((left, right) => {
      const leftCore = core.indexOf(left);
      const rightCore = core.indexOf(right);
      if (leftCore !== -1 && rightCore !== -1) {
        return leftCore - rightCore;
      }
      if (leftCore !== -1) {
        return -1;
      }
      if (rightCore !== -1) {
        return 1;
      }
      return titleOf(left).localeCompare(titleOf(right), "ru");
    })
    .map((slug) => {
      const skill = ownBySlug.get(slug);
      return {
        key: slug,
        title: titleOf(slug),
        level: skill?.level ?? null,
        verification: skill?.verification ?? null,
        verifiedAt: skill?.verifiedAt ?? null,
        inProfile: Boolean(skill),
      };
    });
  return { sections, related, untested };
}
