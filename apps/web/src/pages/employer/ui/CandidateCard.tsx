import { candidateMeta } from "@/pages/employer/model/candidate-meta";
import { inviteLabel } from "@/pages/employer/model/invite-label";
import { CandidateBadges } from "@/pages/employer/ui/CandidateBadges";
import { CandidateSkills } from "@/pages/employer/ui/CandidateSkills";
import { FspHistory } from "@/pages/employer/ui/FspHistory";
import { InvitationBadge } from "@/pages/employer/ui/InvitationBadge";
import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import type { CandidateSnapshot, Invitation } from "@hh/contracts";

type Props = {
  candidate: CandidateSnapshot;
  invitation: Invitation | null;
  canInvite: boolean;
  onInvite: () => void;
};

// Кандидат в поиске по банку. Без потребности оценки совпадения нет — только то, что подтверждено.
export const CandidateCard = ({
  candidate,
  invitation,
  canInvite,
  onInvite,
}: Props) => {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={6}>
            <Group gap="xs">
              <Text fw={700} size="lg">
                {candidate.alias}
              </Text>
              <InvitationBadge invitation={invitation} />
            </Group>
            <CandidateBadges candidate={candidate} />
            <Text size="sm" c="dimmed">
              {candidateMeta(candidate)}
            </Text>
          </Stack>
          {candidate.assessmentScore === null ? null : (
            <Stack gap={0} align="flex-end">
              <Text fw={700} size="xl" c="fsp.6">
                {candidate.assessmentScore}
              </Text>
              <Text size="xs" c="dimmed">
                балл теста
              </Text>
            </Stack>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <CandidateSkills skills={candidate.skills} />
          <FspHistory achievements={candidate.fspAchievements} />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button onClick={onInvite} disabled={!canInvite}>
            {inviteLabel(invitation, canInvite)}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};
