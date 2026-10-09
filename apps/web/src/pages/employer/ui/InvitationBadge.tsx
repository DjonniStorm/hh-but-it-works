import { invitationStatusLabel } from "@/shared/lib/labels";
import { invitationStatusColor } from "@/shared/theme";
import { Badge } from "@mantine/core";

import type { Invitation } from "@hh/contracts";

// Статус последнего приглашения кандидату. Не звали — ничего не показываем.
export const InvitationBadge = ({
  invitation,
}: {
  invitation: Invitation | null;
}) => {
  if (!invitation) {
    return null;
  }
  return (
    <Badge
      variant="light"
      color={invitationStatusColor[invitation.status]}
      tt="none"
    >
      Приглашение: {invitationStatusLabel[invitation.status]}
    </Badge>
  );
};
