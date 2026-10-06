import { scoreTone } from "@/pages/employer/model/score-tone";
import { RingProgress, Stack, Text } from "@mantine/core";

export const ScoreRing = ({ value }: { value: number }) => {
  return (
    <Stack gap={0} align="center">
      <RingProgress
        size={84}
        thickness={8}
        roundCaps
        sections={[{ value, color: scoreTone(value) }]}
        label={
          <Text ta="center" fw={700} size="xl">
            {value}
          </Text>
        }
      />
      <Text size="xs" c="dimmed">
        совпадение
      </Text>
    </Stack>
  );
};
