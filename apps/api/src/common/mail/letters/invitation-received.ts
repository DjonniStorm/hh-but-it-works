import { formatSalary } from "@hh/contracts";

import { type Letter, automaticFootnote, renderLetter } from "./layout";

export type InvitationReceived = {
  companyName: string;
  needTitle: string | null;
  salaryFrom: number;
  salaryTo: number;
  message: string;
};

// Кандидату: новое приглашение. Условия видны сразу, до входа (ТЗ: зарплата
// до начала общения), но ответить можно только в кабинете.
export function invitationReceivedLetter(
  invitation: InvitationReceived,
  link: string,
): Letter {
  const position = invitation.needTitle
    ? ` на позицию «${invitation.needTitle}»`
    : "";
  return renderLetter({
    subject: `Приглашение от ${invitation.companyName} — ЛЦТ`,
    heading: "Вас пригласили",
    paragraphs: [
      `${invitation.companyName} приглашает вас${position}.`,
      `Зарплата: ${formatSalary(invitation.salaryFrom, invitation.salaryTo)}.`,
      invitation.message,
      "Контакты откроются компании, только если вы примете приглашение.",
    ],
    action: { label: "Посмотреть приглашение", url: link },
    footnote: automaticFootnote,
  });
}
