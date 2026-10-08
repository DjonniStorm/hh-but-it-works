import { formatSalary } from "@hh/contracts";

import { type Letter, automaticFootnote, renderLetter } from "./layout";

export type InvitationAnswered = {
  candidateAlias: string;
  needTitle: string | null;
  salaryFrom: number;
  salaryTo: number;
  accepted: boolean;
};

// Работодателю: кандидат ответил. Контакт в письмо не кладём, он открыт в кабинете.
export function invitationAnsweredLetter(
  answer: InvitationAnswered,
  link: string,
): Letter {
  const offer = [
    answer.needTitle ? `Позиция: «${answer.needTitle}».` : null,
    `Зарплата: ${formatSalary(answer.salaryFrom, answer.salaryTo)}.`,
  ]
    .filter(Boolean)
    .join(" ");
  if (answer.accepted) {
    return renderLetter({
      subject: `${answer.candidateAlias} принял приглашение — ЛЦТ`,
      heading: "Приглашение принято",
      paragraphs: [
        `${answer.candidateAlias} принял ваше приглашение. ${offer}`,
        "Контакты кандидата теперь открыты в разделе «Приглашения».",
      ],
      action: { label: "Открыть контакты", url: link },
      footnote: automaticFootnote,
    });
  }
  return renderLetter({
    subject: `${answer.candidateAlias} отклонил приглашение — ЛЦТ`,
    heading: "Приглашение отклонено",
    paragraphs: [
      `${answer.candidateAlias} отклонил ваше приглашение. ${offer}`,
      "Подборка по-прежнему доступна: можно пригласить другого кандидата.",
    ],
    action: { label: "Перейти к приглашениям", url: link },
    footnote: automaticFootnote,
  });
}
