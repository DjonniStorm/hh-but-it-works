import {
  type ActiveAttempt,
  totalMinutes,
} from "@/pages/profile/model/attempt";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import { Button, Group, Stack, Text, Title } from "@mantine/core";

export const TestingPlan = ({
  attempt,
  onBegin,
}: {
  attempt: ActiveAttempt;
  onBegin: () => void;
}) => {
  return (
    <Stack maw={640} gap="md">
      <Title order={3}>
        Попытка на {optionLabel(gradeOptions, attempt.grade)}
      </Title>
      <Text>
        {attempt.total} вопросов, около {totalMinutes(attempt.sections)} мин.
        Таймер первого вопроса включится после кнопки.
      </Text>
      <Stack gap="xs" component="ol" style={{ paddingLeft: "1.25rem" }}>
        {attempt.sections.map((section) => {
          return (
            <Group key={section.skillId} justify="space-between" component="li">
              <Text>{section.title}</Text>
              <Text c="dimmed">{section.count}</Text>
            </Group>
          );
        })}
      </Stack>
      <Text size="sm" c="dimmed">
        Браузер займёт весь экран. Выход прячет вопрос, таймер при этом идёт.
      </Text>
      <Button type="button" onClick={onBegin}>
        Начать первый вопрос
      </Button>
    </Stack>
  );
};
