import { scoreTone } from "@/pages/employer/model/score-tone";
import type { ProfileProgress } from "@/pages/home/model/progress";
import {
  gradeOptions,
  optionLabel,
  specializationOptions,
} from "@/pages/profile/model/options";
import { surfaceColor } from "@/shared/theme";
import {
  Badge,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

// Hero главной: кто я + кольцо готовности анкеты. Кольцо растёт вместе с чек-листом.
export const HomeHero = ({
  profile,
  progress,
}: {
  profile: CandidateProfile | null;
  progress: ProfileProgress;
}) => {
  const name = profile?.displayName;
  const specialization =
    optionLabel(specializationOptions, profile?.specialization ?? null) ??
    "Специализация не выбрана";
  const verifiedGrade = optionLabel(
    gradeOptions,
    profile?.verifiedGrade ?? null,
  );
  const done = progress.steps.filter((step) => {
    return step.done;
  }).length;

  return (
    <Paper withBorder p="xl" radius="md" style={{ background: surfaceColor }}>
      <Group justify="space-between" gap="lg" align="center">
        <Stack gap={6}>
          <Title order={2}>{name || "Ваш профиль"}</Title>
          <Text c="dimmed">
            {specialization}
            {verifiedGrade
              ? `, ${verifiedGrade}`
              : profile?.claimedGrade
                ? ", грейд не подтверждён"
                : ""}
          </Text>
          {profile ? (
            <Badge color={profile.listed ? "fsp" : "gray"} variant="light">
              {profile.listed ? "На бирже" : "Не на бирже"}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              Загружаем анкету…
            </Text>
          )}
        </Stack>
        <Group gap="xl" align="center">
          {/* Пояснение рядом с кольцом: за что отвечает процент и где детали. */}
          <Text size="sm" c="dimmed" maw={300}>
            {profile
              ? `Готовность — это доля заполненных разделов анкеты: сейчас ${done} из ${progress.steps.length}. Незаполненное собрано в чек-листе ниже.`
              : "Анкета загружается: готовность посчитаем, как только она подгрузится."}
          </Text>
          <Stack align="center" gap={4}>
            <RingProgress
              size={120}
              thickness={10}
              roundCaps
              sections={[
                { value: progress.percent, color: scoreTone(progress.percent) },
              ]}
              label={
                <Text ta="center" fw={700} size="xl">
                  {progress.percent}
                </Text>
              }
            />
            <Text size="xs" c="dimmed">
              готовность анкеты
            </Text>
          </Stack>
        </Group>
      </Group>
    </Paper>
  );
};
