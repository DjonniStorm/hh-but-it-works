import { scoreTone } from "@/pages/employer/model/score-tone";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import { formatDate } from "@/shared/lib/format";
import { ROUTES } from "@/shared/router/routes";
import { surfaceColor } from "@/shared/theme";
import {
  Anchor,
  Badge,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "react-router";

import type { CandidateProfile } from "@hh/contracts";

// Итог последней зачётной попытки живёт в профиле: assessmentScore + verifiedGrade.
export const AttemptWidget = ({
  profile,
}: {
  profile: CandidateProfile | null;
}) => {
  const score = profile?.assessmentScore ?? null;
  const grade = optionLabel(gradeOptions, profile?.verifiedGrade ?? null);

  return (
    <Paper withBorder p="lg" radius="md" style={{ background: surfaceColor }}>
      <Stack gap="sm">
        <Title order={4}>Тестирование</Title>
        {score === null ? (
          <>
            <Text size="sm" c="dimmed">
              Грейд ещё не подтверждён тестом — компании видят только вашу
              самооценку.
            </Text>
            <Anchor
              size="sm"
              component={Link}
              to={`${ROUTES.PROFILE}?tab=testing`}
            >
              Пройти тест
            </Anchor>
          </>
        ) : (
          <>
            <Group justify="space-between" gap="xs">
              <Text size="sm">Итог теста</Text>
              <Text size="sm" fw={600}>
                {score}
              </Text>
            </Group>
            <Progress
              value={score}
              color={scoreTone(score)}
              size="lg"
              radius="xl"
              aria-label={`Итог теста: ${score} из 100`}
            />
            <Group gap="xs">
              {grade ? (
                <Badge color="fsp" variant="light">
                  {grade} подтверждён
                </Badge>
              ) : null}
              {profile?.verifiedAt ? (
                <Text size="xs" c="dimmed">
                  {formatDate(profile.verifiedAt)}
                </Text>
              ) : null}
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
};
