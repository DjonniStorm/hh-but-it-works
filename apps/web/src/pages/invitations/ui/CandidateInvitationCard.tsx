import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  canAnswer,
  candidateStatusLabel,
} from "@/pages/invitations/model/answer";
import { DeclineButton } from "@/pages/invitations/ui/DeclineButton";
import { formatDate } from "@/shared/lib/format";
import { RichTextView } from "@/shared/rich-text/ui/RichTextView";
import { candidateInvitationColor } from "@/shared/theme";
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { observer } from "mobx-react-lite";

import { type CandidateInvitation, formatSalary } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

export const CandidateInvitationCard = observer(
  ({ invitation }: { invitation: CandidateInvitation }) => {
    const invitations = useStore(StoreKey.CandidateInvitations);

    return (
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Title order={3}>{invitation.companyName}</Title>
              {invitation.companyIndustry ? (
                <Text c="dimmed" size="sm">
                  {invitation.companyIndustry}
                </Text>
              ) : null}
              {invitation.needTitle ? (
                <Text c="dimmed" size="sm">
                  {invitation.needTitle}
                </Text>
              ) : null}
            </Stack>
            {/* Статус читается целиком: сжимается название компании, не бейдж. */}
            <Badge
              variant="light"
              color={candidateInvitationColor[invitation.status]}
              tt="none"
              style={{ flexShrink: 0 }}
            >
              {candidateStatusLabel[invitation.status]}
            </Badge>
          </Group>

          <Text fw={700} size="lg">
            {formatSalary(invitation.salaryFrom, invitation.salaryTo)}
          </Text>
          <RichTextView doc={invitation.message} />

          {invitation.companyDescription ? (
            <>
              <Divider />
              <div>
                <Text fw={700} size="sm" mb={4}>
                  О компании
                </Text>
                <RichTextView doc={invitation.companyDescription} />
              </div>
            </>
          ) : null}

          <Text size="sm">
            <Text span c="dimmed">
              Связь с компанией:{" "}
            </Text>
            {invitation.contact}
          </Text>

          <Group justify="space-between" align="center">
            <Text c="dimmed" size="xs">
              {formatDate(invitation.createdAt)}
            </Text>
            {canAnswer(invitation.status) ? (
              <Group gap="xs">
                <DeclineButton
                  onConfirm={() => {
                    void invitations.decline(invitation.id);
                  }}
                />
                <Button
                  onClick={() => {
                    void invitations.accept(invitation.id);
                  }}
                >
                  Принять
                </Button>
              </Group>
            ) : (
              <Text c="dimmed" size="sm">
                {invitation.status === InvitationStatus.Accepted
                  ? "Компания видит ваш контакт и свяжется с вами"
                  : invitation.status === InvitationStatus.Withdrawn
                    ? "Компания отозвала приглашение"
                    : "Вы отказались от этого предложения"}
              </Text>
            )}
          </Group>
        </Stack>
      </Paper>
    );
  },
);
