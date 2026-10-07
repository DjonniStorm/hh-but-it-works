import { useState } from "react";

import { candidateMeta } from "@/pages/employer/model/candidate-meta";
import { inviteLabel } from "@/pages/employer/model/invite-label";
import { ReasonList } from "@/pages/employer/ui/ReasonList";
import { ScoreBar } from "@/pages/employer/ui/ScoreBar";
import { ScoreRing } from "@/pages/employer/ui/ScoreRing";
import { WhyMatch } from "@/pages/employer/ui/WhyMatch";
import {
  gradeLabel,
  invitationStatusLabel,
  specializationLabel,
} from "@/shared/lib/labels";
import { gradeBadge, invitationStatusColor } from "@/shared/theme";
import {
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";

import type { Invitation, Match } from "@hh/contracts";

type Props = {
  match: Match;
  rank: number;
  // Последнее приглашение кандидату: показываем его статус.
  invitation: Invitation | null;
  // Нет активного приглашения: можно звать, в том числе повторно после отказа.
  canInvite: boolean;
  onInvite: () => void;
  onDismiss: () => void;
};

export const MatchCard = ({
  match,
  rank,
  invitation,
  canInvite,
  onInvite,
  onDismiss,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { candidate } = match;
  const verified = candidate.verifiedGrade;
  const grade = verified ?? candidate.claimedGrade;
  const gradeStyle = verified ? gradeBadge.verified : gradeBadge.unverified;

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={6}>
            <Group gap="xs">
              <Text c="dimmed" size="sm">
                #{rank}
              </Text>
              <Text fw={700} size="lg">
                {candidate.alias}
              </Text>
              {invitation ? (
                <Badge
                  variant="light"
                  color={invitationStatusColor[invitation.status]}
                  tt="none"
                >
                  Приглашение: {invitationStatusLabel[invitation.status]}
                </Badge>
              ) : null}
            </Group>
            <Group gap={6}>
              <Badge variant="outline" color="dark" tt="none">
                {specializationLabel[candidate.specialization]}
              </Badge>
              <Badge
                variant={gradeStyle.variant}
                color={gradeStyle.color}
                tt="none"
              >
                {gradeLabel[grade]} ·{" "}
                {verified ? "подтверждён" : "не подтверждён"}
              </Badge>
              {verified && verified !== candidate.claimedGrade ? (
                <Text size="xs" c="dimmed">
                  заявлял {gradeLabel[candidate.claimedGrade]}
                </Text>
              ) : null}
            </Group>
            <Text size="sm" c="dimmed">
              {candidateMeta(candidate)}
            </Text>
          </Stack>
          <ScoreRing value={match.matchScore} />
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <ScoreBar
            label="Квалификация"
            hint="что подтверждено"
            value={match.qualification}
          />
          <ScoreBar
            label="Условия"
            hint="зарплата, формат"
            value={match.opportunityFit}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <ReasonList
            title="Почему подходит"
            items={match.reasons}
            kind="positive"
          />
          <ReasonList
            title="На что обратить внимание"
            items={match.risks}
            kind="risk"
          />
        </SimpleGrid>

        <Group justify="space-between">
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={() => {
              setExpanded((value) => {
                return !value;
              });
            }}
            aria-expanded={expanded}
          >
            {expanded ? "Скрыть разбор" : "Почему в подборке"}
          </Button>
          <Group gap="xs">
            <Button variant="default" onClick={onDismiss}>
              Не подходит
            </Button>
            <Button onClick={onInvite} disabled={!canInvite}>
              {inviteLabel(invitation, canInvite)}
            </Button>
          </Group>
        </Group>

        <Collapse expanded={expanded}>
          <WhyMatch match={match} />
        </Collapse>
      </Stack>
    </Paper>
  );
};
