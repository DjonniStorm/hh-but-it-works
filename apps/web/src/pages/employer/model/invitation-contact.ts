import { InvitationStatus } from "@hh/types";

// Что стоит на месте контакта, пока кандидат его не открыл.
export function contactHint(status: InvitationStatus): string {
  if (status === InvitationStatus.Declined) {
    return "Кандидат отказался";
  }
  if (status === InvitationStatus.Withdrawn) {
    return "Вы отозвали приглашение";
  }
  return "Откроется после принятия";
}
