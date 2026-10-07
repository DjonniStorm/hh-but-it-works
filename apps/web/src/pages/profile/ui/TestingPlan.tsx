import {
  type ActiveAttempt,
  totalMinutes,
} from "@/pages/profile/model/attempt";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";

export const TestingPlan = ({
  attempt,
  onBegin,
}: {
  attempt: ActiveAttempt;
  onBegin: () => void;
}) => {
  return (
    <Paper shadow="md" withBorder p="xl" radius="md">
      <Stack>
        <Title order={3}>
          План попытки на {optionLabel(gradeOptions, attempt.grade)}
        </Title>
        <Text>
          {attempt.total} вопросов, примерно {totalMinutes(attempt.sections)}{" "}
          мин. Таймер первого вопроса запустится после кнопки ниже.
        </Text>
        {attempt.sections.map((section, index) => {
          return (
            <Paper key={section.skillId} withBorder p="sm" radius="md">
              <Group justify="space-between">
                <Text fw={600}>
                  {index + 1}. {section.title}
                </Text>
                <Text c="dimmed">{section.count} вопр.</Text>
              </Group>
            </Paper>
          );
        })}
        <Text size="sm" c="dimmed">
          Браузер перейдёт в полноэкранный режим. Выход из него ставит вопрос на
          паузу, а таймер продолжает идти.
        </Text>
        <Button type="button" onClick={onBegin}>
          Начать: первый вопрос
        </Button>
      </Stack>
    </Paper>
  );
};
