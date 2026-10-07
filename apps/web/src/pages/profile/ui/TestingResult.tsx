import {
  type AttemptResult,
  annulBelow,
  flagLabels,
  sectionPassScore,
  statusColors,
  statusLabels,
} from "@/pages/profile/model/attempt";
import { gradeOptions, optionLabel } from "@/pages/profile/model/options";
import {
  Badge,
  Box,
  Button,
  Group,
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
    <Stack maw={640} gap="md">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>{statusLabels[result.status]}</Title>
        <Text fz={48} lh={1}>
          {result.score}
        </Text>
      </Group>
      <Text>{verdict(result, grade)}</Text>
      <Stack gap="sm">
        {result.sections.map((section) => {
          return (
            <Stack key={section.skillId} gap={4}>
              <Group justify="space-between">
                <Text>{section.title}</Text>
                <Text>{section.score}</Text>
              </Group>
              <Box pos="relative">
                <Progress
                  value={section.score}
                  color={section.passed ? "fsp" : "fspRed"}
                  aria-label={`${section.title}: ${section.score} из 100`}
                />
                <Box
                  pos="absolute"
                  top={0}
                  bottom={0}
                  left={`${sectionPassScore}%`}
                  w={1}
                  bg="dark.4"
                />
              </Box>
            </Stack>
          );
        })}
      </Stack>
      <Text size="sm" c="dimmed">
        Черта на полосе — порог {sectionPassScore}.
      </Text>
      <Text>Чистота {result.integrity}</Text>
      {result.flags.length === 0 ? (
        <Text size="sm" c="dimmed">
          Нарушений не записано.
        </Text>
      ) : (
        result.flags.map((flag) => {
          return (
            <Group key={flag.type} justify="space-between">
              <Text size="sm">{flagLabels[flag.type]}</Text>
              <Badge color={statusColors[result.status]} variant="light">
                {flag.count}
              </Badge>
            </Group>
          );
        })
      )}
      <Button type="button" onClick={onBack}>
        К тестированию
      </Button>
    </Stack>
  );
};

function verdict(result: AttemptResult, grade: string | null): string {
  if (result.status === AttemptStatus.Passed) {
    if (result.gradeChanged) {
      return `Грейд ${grade} подтверждён и виден работодателям.`;
    }
    return `Грейд ${grade} подтверждён повторно, балл в профиле обновлён.`;
  }
  if (result.status === AttemptStatus.Failed) {
    return "Грейд в профиле не меняется. Можно пересдать или выбрать грейд ниже.";
  }
  return `Чистота ${result.integrity} ниже ${annulBelow}. Результат не засчитан, профиль не изменился.`;
}
