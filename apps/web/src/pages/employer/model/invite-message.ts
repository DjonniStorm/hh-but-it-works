import type { CompanyProfile, HiringNeed } from "@hh/contracts";

// Черновик текста приглашения. Из поиска по банку зовут без потребности — тогда без её названия.
export function inviteMessage(
  company: CompanyProfile,
  need: HiringNeed | null,
): string {
  if (!need) {
    return `Здравствуйте! ${company.name} хочет обсудить с вами работу в команде.`;
  }
  return [
    `Здравствуйте! ${company.name} ищет специалиста: ${need.title}.`,
    need.description,
  ]
    .filter(Boolean)
    .join("\n\n");
}
