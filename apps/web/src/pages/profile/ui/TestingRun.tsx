import { useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import {
  type ActiveAttempt,
  sectionIndexOf,
} from "@/pages/profile/model/attempt";
import { answerItem } from "@/pages/profile/model/run-attempt";
import { TestingQuestion } from "@/pages/profile/ui/TestingQuestion";
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core";

export const TestingRun = ({
  attempt,
  fullscreenLost,
  onFullscreen,
  onAnswered,
  onStale,
}: {
  attempt: ActiveAttempt;
  fullscreenLost: boolean;
  onFullscreen: () => void;
  onAnswered: (next: ActiveAttempt) => void;
  // Сервер уже закрыл вопрос: перечитываем текущее состояние попытки.
  onStale: () => void;
}) => {
  const root = useRootStore();
  const [sending, setSending] = useState(false);
  const item = attempt.item;
  const sectionIndex = sectionIndexOf(attempt);
  const section = attempt.sections[sectionIndex];

  return (
    <Paper shadow="md" withBorder p="xl" radius="md">
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>
            Вопрос {Math.min(attempt.index + 1, attempt.total)} из{" "}
            {attempt.total}
          </Text>
          {section ? (
            <Badge variant="light">
              Секция {sectionIndex + 1} из {attempt.sections.length}:{" "}
              {section.title}
            </Badge>
          ) : null}
        </Group>
        <Progress value={(attempt.index / attempt.total) * 100} />
        {fullscreenLost ? (
          <Alert color="red" variant="light" title="Вопрос на паузе">
            <Stack gap="sm">
              <Text size="sm">
                Вы вышли из полноэкранного режима, это записано. Таймер вопроса
                идёт. Вернитесь, чтобы продолжить.
              </Text>
              <Button type="button" color="red" onClick={onFullscreen}>
                Вернуться в полноэкранный режим
              </Button>
            </Stack>
          </Alert>
        ) : null}
        {item && attempt.secondsLeft !== null ? (
          <TestingQuestion
            key={item.itemId}
            item={item}
            secondsLeft={attempt.secondsLeft}
            hidden={fullscreenLost}
            sending={sending}
            onSubmit={(draft) => {
              // Таймер и кнопка могут сработать одновременно: второй ответ сервер отклонит.
              if (sending) {
                return;
              }
              setSending(true);
              void answerItem(
                root,
                {
                  attemptId: attempt.attemptId,
                  itemId: item.itemId,
                  choices: draft.choices,
                  value: draft.value ?? undefined,
                },
                {
                  onSuccess: (next) => {
                    setSending(false);
                    onAnswered(next);
                  },
                  onError: () => {
                    setSending(false);
                    onStale();
                  },
                },
              ).catch(() => {
                return undefined;
              });
            }}
          />
        ) : null}
      </Stack>
    </Paper>
  );
};
