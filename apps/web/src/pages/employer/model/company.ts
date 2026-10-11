import { type CompanyProfile, emptyRichText } from "@hh/contracts";

export const emptyCompany: CompanyProfile = {
  name: "",
  industry: "",
  description: emptyRichText(),
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
    // Документ вложенный — копируем вглубь: ссылка на observable-прокси роняет
    // klona в Mantine при каждом сохранении поля (бесконечная рекурсия).
    description: JSON.parse(JSON.stringify(company.description)),
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
