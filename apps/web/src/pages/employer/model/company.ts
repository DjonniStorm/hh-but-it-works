import type { CompanyProfile } from "@hh/contracts";

export const emptyCompany: CompanyProfile = {
  name: "",
  industry: "",
  description: "",
  website: "",
  contactEmail: "",
  contactTelegram: "",
};

// В поле пишут и «@company_hr», и готовую ссылку: ссылку отдаём как есть.
export function telegramUrl(handle: string): string {
  const value = handle.trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://t.me/${value.replace(/^@/, "")}`;
}
