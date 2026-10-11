import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ResumeTemplateMenu } from "@/shared/resume/ui/ResumeTemplateMenu";
import { Button } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { Invitation } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

// Действие по приглашению: отозвать, пока кандидат не ответил, или скачать резюме после принятия.
export const InvitationActions = observer(({ item }: { item: Invitation }) => {
  const invitations = useStore(StoreKey.Invitations);

  if (
    item.status === InvitationStatus.Sent ||
    item.status === InvitationStatus.Viewed
  ) {
    return (
      <Button
        size="xs"
        variant="default"
        onClick={() => {
          void invitations.withdraw(item.id);
        }}
      >
        Отозвать
      </Button>
    );
  }
  if (item.status === InvitationStatus.Accepted) {
    return (
      <ResumeTemplateMenu
        label="Резюме PDF"
        size="xs"
        onPick={(template) => {
          void invitations.downloadResume(item.id, template);
        }}
      />
    );
  }
  return null;
});
