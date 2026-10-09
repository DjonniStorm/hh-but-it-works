import type { CandidateProfile } from "@hh/contracts";

// Разделы анкеты, которые живут отдельными плитками. Появляются по кнопке «Добавить раздел».
export type SectionKey = "education" | "experience";

export const sectionOrder: SectionKey[] = ["education", "experience"];

export const sectionLabels: Record<SectionKey, string> = {
  education: "Образование",
  experience: "Опыт работы",
};

const hasData: Record<SectionKey, (profile: CandidateProfile) => boolean> = {
  education: (profile) => {
    return profile.education.length > 0;
  },
  experience: (profile) => {
    return profile.experience.length > 0;
  },
};

// Уже заполненные разделы открываем сразу: спрятанные данные кандидат не увидит.
export function initialSections(profile: CandidateProfile): SectionKey[] {
  return sectionOrder.filter((key) => {
    return hasData[key](profile);
  });
}
