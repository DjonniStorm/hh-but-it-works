import { contactHint } from "@/pages/employer/model/invitation-contact";
import { InvitationActions } from "@/pages/employer/ui/InvitationActions";
import { formatDate } from "@/shared/lib/format";
import { invitationStatusLabel } from "@/shared/lib/labels";
import { invitationStatusColor } from "@/shared/theme";
import { Badge, Group, Paper, Stack, Text } from "@mantine/core";

import { type Invitation, formatSalary } from "@hh/contracts";

// Приглашение карточкой: на узком экране вместо строки таблицы.
export const InvitationCard = ({ item }: { item: Invitation }) => {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={600} style={{ overflowWrap: "anywhere" }}>
            {item.candidateAlias}
          </Text>
          <Badge
            variant="light"
            color={invitationStatusColor[item.status]}
            tt="none"
            style={{ flexShrink: 0 }}
          >
            {invitationStatusLabel[item.status]}
          </Badge>
        </Group>
        {item.needTitle ? (
          <Text size="sm">{item.needTitle}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            без привязки
          </Text>
        )}
        <Text size="sm">{formatSalary(item.salaryFrom, item.salaryTo)}</Text>
        {item.candidateContact ? (
          <Text size="sm" style={{ overflowWrap: "anywhere" }}>
            {item.candidateContact}
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            {contactHint(item.status)}
          </Text>
        )}
        <Group justify="space-between" mih={30}>
          <InvitationActions item={item} />
          <Text size="xs" c="dimmed" ml="auto">
            {formatDate(item.createdAt)}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
};
