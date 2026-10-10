import type { ProfileProgress } from "@/pages/home/model/progress";
import { surfaceColor } from "@/shared/theme";
import { Anchor, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

// Чек-лист незаполненного: те же шаги, что кольцо в hero, но только невыполненные.
export const ChecklistWidget = ({
  progress,
}: {
  progress: ProfileProgress;
}) => {
  const missing = progress.steps.filter((step) => {
    return !step.done;
  });
  const filled = progress.steps.length - missing.length;

  return (
    <Paper withBorder p="lg" radius="md" style={{ background: surfaceColor }}>
      <Stack gap="sm">
        <Group justify="space-between" gap="xs">
          <Title order={4}>Чек-лист профиля</Title>
          <Text size="sm" c="dimmed">
            {filled} из {progress.steps.length}
          </Text>
        </Group>
        {missing.length === 0 ? (
          <Text size="sm">
            Анкета собрана — компании могут вас найти и пригласить.
          </Text>
        ) : (
          <Stack gap={4}>
            {missing.map((step) => {
              return (
                <Group key={step.label} justify="space-between" gap="xs">
                  <Text size="sm">{step.label}</Text>
                  <Anchor size="sm" component={Link} to={step.to}>
                    Заполнить
                  </Anchor>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
