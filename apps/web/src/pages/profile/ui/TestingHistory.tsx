import {
  type AttemptHistory,
  attemptCategory,
  formatDate,
  statusColors,
  statusLabels,
} from "@/pages/profile/model/attempt";
import { Badge, Divider, Group, Stack, Text, Title } from "@mantine/core";

export const TestingHistory = ({
  items,
}: {
  items: AttemptHistory["items"];
}) => {
  return (
    <Stack gap="sm">
      <Divider />
      <Title order={4}>История попыток</Title>
      {items.length === 0 ? (
        <Text c="dimmed">Попыток пока не было.</Text>
      ) : (
        items.map((item) => {
          return (
            <Group key={item.attemptId} justify="space-between" wrap="nowrap">
              <Stack gap={0}>
                <Text>
                  {formatDate(item.finishedAt)}, {attemptCategory(item)}
                </Text>
                <Text size="sm" c="dimmed">
                  Балл {item.score}, чистота {item.integrity}
                </Text>
              </Stack>
              <Badge color={statusColors[item.status]} variant="light">
                {statusLabels[item.status]}
              </Badge>
            </Group>
          );
        })
      )}
    </Stack>
  );
};
