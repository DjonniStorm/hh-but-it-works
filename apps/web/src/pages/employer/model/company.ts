import type { CompanyProfile } from "@hh/contracts";

export const emptyCompany: CompanyProfile = {
  name: "",
  industry: "",
  description: "",
  website: "",
  contactEmail: "",
  contactTelegram: "",
};

// Профиль из стора — observable MobX. Форма клонирует и пишет в initialValues,
// на проксях стора поля не редактируются: отдаём ей свежий объект.
export function companyFormValues(company: CompanyProfile): CompanyProfile {
  return {
    name: company.name,
    industry: company.industry,
    description: company.description,
    website: company.website,
    contactEmail: company.contactEmail,
    contactTelegram: company.contactTelegram,
  };
}

// В поле пишут и «@company_hr», и готовую ссылку: ссылку отдаём как есть.
export function telegramUrl(handle: string): string {
  const value = handle.trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://t.me/${value.replace(/^@/, "")}`;
}
