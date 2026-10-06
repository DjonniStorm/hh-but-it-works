import type { CompanyProfile, HiringNeedRecord } from "@hh/contracts";
import { Grade, Specialization, WorkFormat } from "@hh/types";

type CompanyOutput = {
  name: string;
  industry: string;
  description: string;
  website: string;
  contactEmail: string;
  contactTelegram: string;
};

type NeedOutput = {
  id: string;
  title: string;
  specialization: string;
  gradeFrom: string;
  gradeTo: string;
  mustSkills: string[];
  niceSkills: string[];
  workFormat: string;
  salaryFrom: number;
  salaryTo: number;
  description: string;
  createdAt: string;
};

export function mapCompany(company: CompanyOutput): CompanyProfile {
  return {
    name: company.name,
    industry: company.industry,
    description: company.description,
    website: company.website,
    contactEmail: company.contactEmail,
    contactTelegram: company.contactTelegram,
  };
}

export function mapNeed(need: NeedOutput): HiringNeedRecord {
  return {
    id: need.id,
    title: need.title,
    specialization: oneOf(
      Specialization,
      need.specialization,
      "Неизвестная специализация",
    ),
    gradeFrom: oneOf(Grade, need.gradeFrom, "Неизвестный грейд"),
    gradeTo: oneOf(Grade, need.gradeTo, "Неизвестный грейд"),
    mustSkills: need.mustSkills,
    niceSkills: need.niceSkills,
    workFormat: oneOf(WorkFormat, need.workFormat, "Неизвестный формат работы"),
    salaryFrom: need.salaryFrom,
    salaryTo: need.salaryTo,
    description: need.description,
    createdAt: need.createdAt,
  };
}

// Строка из ответа API → значение enum. Незнакомое значение — ошибка контракта, а не тихий undefined.
function oneOf<T extends string>(
  values: Record<string, T>,
  value: string,
  message: string,
): T {
  const match = Object.values(values).find((item) => {
    return item === value;
  });
  if (match === undefined) {
    throw new Error(message);
  }
  return match;
}
