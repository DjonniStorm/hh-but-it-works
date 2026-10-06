import { scoreTone } from "@/pages/employer/model/score-tone";
import { matchGroupLabel } from "@/shared/lib/labels";
import { Group, List, Progress, Stack, Text } from "@mantine/core";

import type { MatchBreakdown } from "@hh/contracts";

export const BreakdownGroup = ({ item }: { item: MatchBreakdown }) => {
  const label = matchGroupLabel[item.group];

  return (
    <Stack gap={6}>
      <Group justify="space-between" gap="xs">
        <Text size="sm" fw={600}>
          {label}
        </Text>
        <Text size="xs" c="dimmed">
          {item.score}/100 · вес {Math.round(item.weight * 100)}%
        </Text>
      </Group>
      <Progress
        value={item.score}
        color={scoreTone(item.score)}
        size="sm"
        aria-label={`${label}: ${item.score} из 100`}
      />
      <List size="xs" spacing={2} c="dimmed">
        {item.details.map((detail) => {
          return <List.Item key={detail}>{detail}</List.Item>;
        })}
      </List>
    </Stack>
  );
};
