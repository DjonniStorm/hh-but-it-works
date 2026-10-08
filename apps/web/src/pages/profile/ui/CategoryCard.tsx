import { gradeAdvice } from "@/pages/profile/model/grade-advice";
import {
  gradeOptions,
  optionLabel,
  specializationOptions,
} from "@/pages/profile/model/options";
import { Badge, Group, Stack, Text, Title } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

// Категория — то, по чему работодатель находит кандидата: специализация и подтверждённый грейд.
export const CategoryCard = ({ profile }: { profile: CandidateProfile }) => {
  const specialization =
    optionLabel(specializationOptions, profile.specialization) ??
    "Специализация не выбрана";
  const verified = optionLabel(gradeOptions, profile.verifiedGrade);
  const advice = gradeAdvice(profile).at(-1);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-end">
        <Title order={3}>
          {specialization}
          {verified ? `, ${verified}` : ", грейд не подтверждён"}
        </Title>
        <Badge color={profile.listed ? "fsp" : "gray"} variant="light">
          {profile.listed ? "На бирже" : "Не на бирже"}
        </Badge>
      </Group>
      {advice ? <Text size="sm">{advice}</Text> : null}
    </Stack>
  );
};
