import type { CandidateProfile } from "../candidate-profile.entity";
import type { IconName } from "./icons";

export enum ContactKind {
  Email = "email",
  Telegram = "telegram",
  Github = "github",
  Linkedin = "linkedin",
  Website = "website",
}

export const contactLabel: Record<ContactKind, string> = {
  [ContactKind.Email]: "Email",
  [ContactKind.Telegram]: "Telegram",
  [ContactKind.Github]: "GitHub",
  [ContactKind.Linkedin]: "LinkedIn",
  [ContactKind.Website]: "Сайт",
};

export const contactIcon: Record<ContactKind, IconName> = {
  [ContactKind.Email]: "envelope",
  [ContactKind.Telegram]: "telegram",
  [ContactKind.Github]: "github",
  [ContactKind.Linkedin]: "linkedin",
  [ContactKind.Website]: "globe",
};

// Как в Reactive Resume: почта и сайт в шапке, профили соцсетей — разделом «Ссылки».
export const profileKinds: ReadonlySet<ContactKind> = new Set([
  ContactKind.Github,
  ContactKind.Linkedin,
]);

export type ResumeContact = { kind: ContactKind; value: string; url: string };

export function contactsOf(
  profile: CandidateProfile,
  email: string | null,
): ResumeContact[] {
  const values: [ContactKind, string | null][] = [
    [ContactKind.Email, email],
    [ContactKind.Telegram, profile.telegram],
    [ContactKind.Github, profile.github],
    [ContactKind.Linkedin, profile.linkedin],
    [ContactKind.Website, profile.website],
  ];
  return values.flatMap(([kind, raw]) => {
    const value = raw?.trim();
    if (!value) {
      return [];
    }
    return [{ kind, value, url: urlOf(kind, value) }];
  });
}

// В поля пишут и «@nick», и готовую ссылку. Ссылку отдаём как есть, остальное достраиваем.
function urlOf(kind: ContactKind, value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (kind === ContactKind.Email) {
    return `mailto:${value}`;
  }
  if (kind === ContactKind.Telegram && !value.includes("/")) {
    return `https://t.me/${value.replace(/^@/, "")}`;
  }
  if (kind === ContactKind.Github && !value.includes("/")) {
    return `https://github.com/${value.replace(/^@/, "")}`;
  }
  return `https://${value}`;
}
