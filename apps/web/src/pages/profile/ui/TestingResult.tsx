import {
  type AttemptResult,
  annulBelow,
  flagLabels,
  statusColors,
  statusLabels,
} from "@/pages/profile/model/attempt";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import {
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { AttemptStatus } from "@hh/types";

export const TestingResult = ({
  result,
  onBack,
}: {
  result: AttemptResult;
  onBack: () => void;
}) => {
  const grade = optionLabel(gradeOptions, result.grade);

  return (
    <Paper shadow="md" withBorder p="xl" radius="md">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>Итог попытки на {grade}</Title>
          <Badge color={statusColors[result.status]} size="lg">
            {statusLabels[result.status]}
          </Badge>
        </Group>
        {result.status === AttemptStatus.Passed ? (
          <Text>
            {result.gradeChanged
              ? `Грейд ${grade} подтверждён и виден работодателям.`
              : `Грейд ${grade} подтверждён повторно, балл в профиле обновлён.`}{" "}
            Средний балл {result.score}.
          </Text>
        ) : null}
        {result.status === AttemptStatus.Failed ? (
          <Text>
            Средний балл {result.score}. Грейд в профиле не меняется. Можно
            пересдать или выбрать грейд ниже.
          </Text>
        ) : null}
        {result.status === AttemptStatus.Annulled ? (
          <Text>
            Чистота попытки {result.integrity} — ниже {annulBelow}. Результат не
            засчитан, профиль не изменился.
          </Text>
        ) : null}
        <Title order={4}>Секции</Title>
        {result.sections.map((section) => {
          return (
            <Stack key={section.skillId} gap={4}>
              <Group justify="space-between">
                <Text fw={600}>{section.title}</Text>
                <Group gap="xs">
                  <Text>{section.score}</Text>
                  <Badge
                    color={section.passed ? "green" : "gray"}
                    variant="light"
                  >
                    {section.passed ? "Подтверждён" : "Не подтверждён"}
                  </Badge>
                </Group>
              </Group>
              <Progress
                value={section.score}
                color={section.passed ? "green" : "orange"}
              />
            </Stack>
          );
        })}
        <Title order={4}>Чистота попытки: {result.integrity}</Title>
        {result.flags.length === 0 ? (
          <Text c="dimmed">Нарушений не записано.</Text>
        ) : (
          result.flags.map((flag) => {
            return (
              <Group key={flag.type} justify="space-between">
                <Text>{flagLabels[flag.type]}</Text>
                <Text c="dimmed">× {flag.count}</Text>
              </Group>
            );
          })
        )}
        <Button type="button" onClick={onBack}>
          К тестированию
        </Button>
      </Stack>
    </Paper>
  );
};
