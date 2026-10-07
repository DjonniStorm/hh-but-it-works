import {
  type AttemptHistory,
  formatDate,
  statusColors,
  statusLabels,
} from "@/pages/profile/model/attempt";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";

export const TestingHistory = ({
  items,
}: {
  items: AttemptHistory["items"];
}) => {
  return (
    <Paper shadow="md" withBorder p="xl" radius="md">
      <Stack>
        <Title order={3}>История попыток</Title>
        {items.length === 0 ? (
          <Text c="dimmed">Попыток пока не было.</Text>
        ) : (
          items.map((item) => {
            return (
              <Paper key={item.attemptId} withBorder p="sm" radius="md">
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text fw={600}>
                      {formatDate(item.finishedAt)} ·{" "}
                      {optionLabel(gradeOptions, item.grade)}
                    </Text>
                    <Badge color={statusColors[item.status]} variant="light">
                      {statusLabels[item.status]}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Балл {item.score} · чистота {item.integrity} ·{" "}
                    {item.sections
                      .map((section) => {
                        return `${section.title} ${section.score}`;
                      })
                      .join(", ")}
                  </Text>
                </Stack>
              </Paper>
            );
          })
        )}
      </Stack>
    </Paper>
  );
};
