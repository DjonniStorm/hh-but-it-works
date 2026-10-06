import type { Invitation } from "@hh/contracts";

export function inviteLabel(
  invitation: Invitation | null,
  canInvite: boolean,
): string {
  if (!canInvite) {
    return "Приглашён";
  }
  return invitation ? "Пригласить снова" : "Пригласить";
}
