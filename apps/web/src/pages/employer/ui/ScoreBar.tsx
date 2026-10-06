import { scoreTone } from "@/pages/employer/model/score-tone";
import { Group, Progress, Stack, Text } from "@mantine/core";

export const ScoreBar = ({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: number;
}) => {
  return (
    <Stack gap={4}>
      <Group justify="space-between" gap="xs">
        <Text size="sm">
          {label}{" "}
          <Text span size="xs" c="dimmed">
            {hint}
          </Text>
        </Text>
        <Text size="sm" fw={600}>
          {value}
        </Text>
      </Group>
      <Progress
        value={value}
        color={scoreTone(value)}
        size="sm"
        aria-label={`${label}: ${value} из 100`}
      />
    </Stack>
  );
};
