import type { CandidateInvitation } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

// Подписи со стороны кандидата: «Отправлено» и «Просмотрено» говорят о работодателе, не о нём.
export const candidateStatusLabel: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "Новое",
  [InvitationStatus.Viewed]: "Ждёт ответа",
  [InvitationStatus.Accepted]: "Вы приняли",
  [InvitationStatus.Declined]: "Вы отклонили",
  [InvitationStatus.Withdrawn]: "Компания отозвала",
};

// То же условие, что в InvitationsService.answer: ответить можно один раз.
export function canAnswer(status: InvitationStatus): boolean {
  return status === InvitationStatus.Sent || status === InvitationStatus.Viewed;
}

// Список с сервера уже от новых к старым: фильтр этот порядок сохраняет.
export function waitingInvitations(
  items: CandidateInvitation[],
): CandidateInvitation[] {
  return items.filter((item) => {
    return canAnswer(item.status);
  });
}
