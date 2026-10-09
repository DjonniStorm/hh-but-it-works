import type { HiringNeed } from "@hh/contracts";
import { Grade, type Specialization, WorkFormat } from "@hh/types";

// Значения формы потребности. Пустые поля шире, чем HiringNeedInput: их проверяет резолвер.
export type NeedFormValues = {
  title: string;
  specialization: Specialization | null;
  gradeFrom: Grade | null;
  gradeTo: Grade | null;
  mustSkills: string[];
  niceSkills: string[];
  workFormats: WorkFormat[];
  salaryFrom: number | "";
  salaryTo: number | "";
  description: string;
};

export const emptyNeedForm: NeedFormValues = {
  title: "",
  specialization: null,
  gradeFrom: Grade.Junior,
  gradeTo: Grade.Middle,
  mustSkills: [],
  niceSkills: [],
  workFormats: [WorkFormat.Remote],
  salaryFrom: "",
  salaryTo: "",
  description: "",
};

// Потребность из стора — observable MobX. Массивы копируем: форма клонирует значения
// вглубь и на observable-массиве уходит в бесконечную рекурсию.
export function needFormValues(need: HiringNeed): NeedFormValues {
  return {
    title: need.title,
    specialization: need.specialization,
    gradeFrom: need.gradeFrom,
    gradeTo: need.gradeTo,
    mustSkills: [...need.mustSkills],
    niceSkills: [...need.niceSkills],
    workFormats: [...need.workFormats],
    salaryFrom: need.salaryFrom,
    salaryTo: need.salaryTo,
    description: need.description,
  };
}
