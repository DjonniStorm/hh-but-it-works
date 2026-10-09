import type {
  ContactValues,
  ResumeDraftHit,
  SkillRow,
} from "@/pages/profile/model/types";

import type { CandidateProfile, ResumeDraft } from "@hh/contracts";
import { Grade, SkillLevel, SkillVerification } from "@hh/types";

type ContactForm = {
  setFieldValue: (path: string, value: unknown) => void;
  getValues: () => Pick<
    ContactValues,
    "softSkills" | "education" | "experience"
  >;
};

export function draftHasFields(draft: ResumeDraft): boolean {
  return (
    draft.displayName !== null ||
    draft.specialization !== null ||
    draft.experienceYears !== null ||
    draft.claimedGrade !== null ||
    draft.phone !== null ||
    draft.telegram !== null ||
    draft.github !== null ||
    draft.linkedin !== null ||
    draft.website !== null ||
    draft.desiredSalaryFrom !== null ||
    draft.workFormats.length > 0 ||
    draft.skills.length > 0 ||
    draft.softSkills.length > 0 ||
    draft.education.length > 0 ||
    draft.experience.length > 0
  );
}

// Строковые поля анкеты, которые черновик переносит как есть.
const textFields = [
  "displayName",
  "specialization",
  "phone",
  "telegram",
  "github",
  "linkedin",
  "website",
  "searchStatus",
] as const;

// Подтверждённый грейд черновик не трогает: его ставит только тест.
export function applyContactDraft(
  form: ContactForm,
  draft: ResumeDraft,
  verifiedGrade: Grade | null,
): void {
  for (const field of textFields) {
    const value = draft[field];
    if (value) {
      form.setFieldValue(field, value);
    }
  }
  if (draft.experienceYears !== null) {
    form.setFieldValue("experienceYears", draft.experienceYears);
  }
  if (draft.desiredSalaryFrom !== null) {
    form.setFieldValue("desiredSalaryFrom", draft.desiredSalaryFrom);
  }
  if (draft.workFormats.length > 0) {
    form.setFieldValue("workFormats", draft.workFormats.slice());
  }
  // Свои качества кандидата не стираем, найденные в резюме дописываем в конец.
  if (draft.softSkills.length > 0) {
    const current = form.getValues().softSkills;
    form.setFieldValue("softSkills", [
      ...current,
      ...draft.softSkills.filter((skill) => {
        return !current.includes(skill);
      }),
    ]);
  }
  applyHistoryDraft(form, draft);
  if (!verifiedGrade && draft.claimedGrade) {
    form.setFieldValue("claimedGrade", draft.claimedGrade);
  }
}

// Лимиты плиток: схема сохранения больше записей не примет.
const maxEducation = 8;
const maxExperience = 12;

// Записи из резюме дописываются к введённым. Ту же учёбу или работу второй раз не добавляем.
function applyHistoryDraft(form: ContactForm, draft: ResumeDraft): void {
  const { education, experience } = form.getValues();
  const newEducation = draft.education
    .filter((item) => {
      return !education.some((row) => {
        return row.school === item.school && row.program === item.program;
      });
    })
    .map((item) => {
      return {
        school: item.school,
        program: item.program,
        fromYear: item.fromYear ?? "",
        toYear: item.toYear ?? "",
      };
    });
  if (newEducation.length > 0) {
    form.setFieldValue(
      "education",
      [...education, ...newEducation].slice(0, maxEducation),
    );
  }
  const newExperience = draft.experience
    .filter((item) => {
      return !experience.some((row) => {
        return row.company === item.company && row.fromYear === item.fromYear;
      });
    })
    .map((item) => {
      return {
        company: item.company,
        role: item.role,
        fromYear: item.fromYear,
        toYear: item.toYear ?? "",
        summary: item.summary,
      };
    });
  if (newExperience.length > 0) {
    form.setFieldValue(
      "experience",
      [...experience, ...newExperience].slice(0, maxExperience),
    );
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
