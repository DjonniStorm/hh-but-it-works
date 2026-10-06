import { useState } from "react";

import { ReasonList } from "@/pages/employer/ui/ReasonList";
import { ScoreBar } from "@/pages/employer/ui/ScoreBar";
import { ScoreRing } from "@/pages/employer/ui/ScoreRing";
import { WhyMatch } from "@/pages/employer/ui/WhyMatch";
import { formatSalaryFrom, formatYears } from "@/shared/lib/format";
import {
  gradeLabel,
  invitationStatusLabel,
  specializationLabel,
  workFormatLabel,
} from "@/shared/lib/labels";
import { invitationStatusColor } from "@/shared/theme";
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
  invitation: Invitation | null;
  onInvite: () => void;
  onDismiss: () => void;
};

export const MatchCard = ({
  match,
  rank,
  invitation,
  onInvite,
  onDismiss,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { candidate } = match;
  const verified = candidate.verifiedGrade;
  const grade = verified ?? candidate.claimedGrade;
  const formats = candidate.preferences.workFormats
    .map((format) => {
      return workFormatLabel[format];
    })
    .join(", ");

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
                variant={verified ? "filled" : "outline"}
                color={verified ? "fsp" : "gray"}
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
              {formatYears(candidate.experienceYears)} опыта ·{" "}
              {formatSalaryFrom(candidate.preferences.desiredSalaryFrom)} ·{" "}
              {formats}
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
            <Button onClick={onInvite} disabled={invitation !== null}>
              {invitation ? "Приглашён" : "Пригласить"}
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
