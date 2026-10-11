import {
  type CompanyProfile,
  type HiringNeed,
  type RichTextDoc,
  docFromPlainText,
} from "@hh/contracts";

// Черновик приглашения. Из поиска по банку зовут без потребности — тогда без её названия.
export function inviteMessage(
  company: CompanyProfile,
  need: HiringNeed | null,
): RichTextDoc {
  if (!need) {
    return docFromPlainText(
      `Здравствуйте! ${company.name} хочет обсудить с вами работу в команде.`,
    );
  }
  return docFromPlainText(
    [
      `Здравствуйте! ${company.name} ищет специалиста: ${need.title}.`,
      need.description,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
}
