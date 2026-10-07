import { ActionIcon, Group, Paper, Stack, Text } from "@mantine/core";

// order — индексы показанных шагов в выбранном порядке.
export const OrderAnswer = ({
  steps,
  order,
  onChange,
}: {
  steps: string[];
  order: number[];
  onChange: (order: number[]) => void;
}) => {
  const move = (position: number, shift: -1 | 1) => {
    const target = position + shift;
    if (target < 0 || target >= order.length) {
      return;
    }
    const next = [...order];
    const current = next[position] as number;
    next[position] = next[target] as number;
    next[target] = current;
    onChange(next);
  };

  return (
    <Stack gap="xs">
      {order.map((stepIndex, position) => {
        return (
          <Paper key={stepIndex} withBorder p="xs" radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm">
                {position + 1}. {steps[stepIndex]}
              </Text>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="light"
                  aria-label="Выше"
                  disabled={position === 0}
                  onClick={() => {
                    move(position, -1);
                  }}
                >
                  ↑
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  aria-label="Ниже"
                  disabled={position === order.length - 1}
                  onClick={() => {
                    move(position, 1);
                  }}
                >
                  ↓
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
};
