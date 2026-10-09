import type {
  EducationFormRow,
  ExperienceFormRow,
} from "@/pages/profile/model/types";

import type { EducationEntry, ExperienceEntry } from "@hh/contracts";

export function blankEducation(): EducationFormRow {
  return {
    school: "",
    program: "",
    fromYear: new Date().getFullYear(),
    toYear: "",
  };
}

export function blankExperience(): ExperienceFormRow {
  return {
    company: "",
    role: "",
    fromYear: new Date().getFullYear(),
    toYear: "",
    summary: "",
  };
}

export function educationFromProfile(
  items: EducationEntry[],
): EducationFormRow[] {
  return items.map((item) => {
    return {
      school: item.school,
      program: item.program,
      fromYear: item.fromYear,
      toYear: item.toYear ?? "",
    };
  });
}

export function experienceFromProfile(
  items: ExperienceEntry[],
): ExperienceFormRow[] {
  return items.map((item) => {
    return {
      company: item.company,
      role: item.role,
      fromYear: item.fromYear,
      toYear: item.toYear ?? "",
      summary: item.summary,
    };
  });
}
