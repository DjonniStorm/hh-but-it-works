import { InvitationStatus } from "@hh/types";

// Подписи со стороны кандидата: «Отправлено» и «Просмотрено» говорят о работодателе, не о нём.
export const candidateStatusLabel: Record<InvitationStatus, string> = {
  [InvitationStatus.Sent]: "Новое",
  [InvitationStatus.Viewed]: "Ждёт ответа",
  [InvitationStatus.Accepted]: "Вы приняли",
  [InvitationStatus.Declined]: "Вы отклонили",
};

// То же условие, что в InvitationsService.answer: ответить можно один раз.
export function canAnswer(status: InvitationStatus): boolean {
  return status === InvitationStatus.Sent || status === InvitationStatus.Viewed;
}
