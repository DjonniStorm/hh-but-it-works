import { type Letter, renderLetter } from "./layout";

// Ссылка живёт час: passwordResetTtlSeconds в modules/auth/session.store.ts.
export function passwordResetLetter(link: string): Letter {
  return renderLetter({
    subject: "Сброс пароля — ЛЦТ",
    heading: "Сброс пароля",
    paragraphs: [
      "Мы получили запрос на смену пароля. Чтобы задать новый, нажмите на кнопку.",
      "После смены пароля мы выйдем из аккаунта на всех устройствах.",
    ],
    action: { label: "Задать новый пароль", url: link },
    footnote:
      "Ссылка действует час и срабатывает один раз. Если вы не просили сбросить пароль, просто удалите это письмо: пароль останется прежним.",
  });
}
