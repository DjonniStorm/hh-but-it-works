import { type Letter, renderLetter } from "./layout";

// Ссылка живёт сутки: emailConfirmTtlSeconds в modules/auth/session.store.ts.
export function confirmationLetter(link: string): Letter {
  return renderLetter({
    subject: "Подтвердите почту — ЛЦТ",
    heading: "Подтвердите почту",
    paragraphs: ["Чтобы закончить регистрацию, нажмите на кнопку."],
    action: { label: "Подтвердить почту", url: link },
    footnote:
      "Ссылка действует сутки. Если вы не регистрировались, просто удалите это письмо.",
  });
}
