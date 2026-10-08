import type { ResumeDraftHit, SkillRow } from "@/pages/profile/model/types";

import type { CandidateProfile, ResumeDraft } from "@hh/contracts";
import { Grade, SkillLevel, SkillVerification } from "@hh/types";

type ContactForm = {
  setFieldValue: (path: string, value: unknown) => void;
};

export function draftHasFields(draft: ResumeDraft): boolean {
  return (
    draft.displayName !== null ||
    draft.experienceYears !== null ||
    draft.claimedGrade !== null ||
    draft.telegram !== null ||
    draft.github !== null ||
    draft.skills.length > 0
  );
}

// Подтверждённый грейд черновик не трогает: его ставит только тест.
export function applyContactDraft(
  form: ContactForm,
  draft: ResumeDraft,
  verifiedGrade: Grade | null,
): void {
  if (draft.displayName) {
    form.setFieldValue("displayName", draft.displayName);
  }
  if (draft.telegram) {
    form.setFieldValue("telegram", draft.telegram);
  }
  if (draft.github) {
    form.setFieldValue("github", draft.github);
  }
  if (draft.experienceYears !== null) {
    form.setFieldValue("experienceYears", draft.experienceYears);
  }
  if (!verifiedGrade && draft.claimedGrade) {
    form.setFieldValue("claimedGrade", draft.claimedGrade);
  }
}

export function skillsWithDraft(
  current: SkillRow[],
  catalog: CandidateProfile["skills"],
  hit: ResumeDraftHit,
): SkillRow[] {
  const next = current.slice();
  for (const skill of hit.draft.skills) {
    const known = catalog.find((item) => {
      return item.slug === skill.slug;
    });
    const confirmed =
      known?.verification === SkillVerification.Verified ||
      known?.verification === SkillVerification.VerifiedExternal;
    if (confirmed) {
      continue;
    }
    const already = next.some((row) => {
      return (
        (known !== undefined && row.skillId === known.skillId) ||
        row.title === skill.title
      );
    });
    if (already) {
      continue;
    }
    next.push({
      skillId: known?.skillId,
      title: skill.title,
      level: SkillLevel.Confident,
      verification: null,
      verifiedAt: null,
    });
  }
  return next;
}
