import { gradeAdvice } from "@/pages/profile/model/grade-advice";
import {
  gradeOptions,
  optionLabel,
  specializationOptions,
} from "@/pages/profile/model/options";
import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

// Категория — то, по чему работодатель находит кандидата: специализация и подтверждённый грейд.
export const CategoryCard = ({ profile }: { profile: CandidateProfile }) => {
  const specialization =
    optionLabel(specializationOptions, profile.specialization) ?? "—";
  const verified = optionLabel(gradeOptions, profile.verifiedGrade);

  return (
    <Paper shadow="md" withBorder p="xl" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={3}>Категория</Title>
          <Badge color={profile.listed ? "green" : "gray"} variant="light">
            {profile.listed ? "На бирже" : "Не на бирже"}
          </Badge>
        </Group>
        <Text fw={600}>
          {specialization} · {verified ?? "грейд не подтверждён"}
        </Text>
        <Text size="sm" c="dimmed">
          Заявлено: {optionLabel(gradeOptions, profile.claimedGrade) ?? "—"}. В
          подборке работодателя учитывается подтверждённый грейд.
        </Text>
        {gradeAdvice(profile).map((line) => {
          return (
            <Text key={line} size="sm">
              {line}
            </Text>
          );
        })}
      </Stack>
    </Paper>
  );
};
