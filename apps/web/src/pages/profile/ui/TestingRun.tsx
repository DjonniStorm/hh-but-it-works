import { useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import {
  type ActiveAttempt,
  pauseTexts,
  sectionIndexOf,
} from "@/pages/profile/model/attempt";
import { answerItem } from "@/pages/profile/model/run-attempt";
import type { FullscreenPause } from "@/pages/profile/model/use-integrity-watch";
import { TestingQuestion } from "@/pages/profile/ui/TestingQuestion";
import { TestingSectionRail } from "@/pages/profile/ui/TestingSectionRail";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";

export const TestingRun = ({
  attempt,
  pause,
  onFullscreen,
  onAnswered,
  onStale,
}: {
  attempt: ActiveAttempt;
  pause: FullscreenPause | null;
  onFullscreen: () => void;
  onAnswered: (next: ActiveAttempt) => void;
  onStale: () => void;
}) => {
  const root = useRootStore();
  const [sending, setSending] = useState(false);
  const item = attempt.item;
  const sectionIndex = sectionIndexOf(attempt);

  return (
    <Group align="flex-start" wrap="wrap" gap="xl">
      <TestingSectionRail sections={attempt.sections} current={sectionIndex} />
      <Stack style={{ flex: "1 1 28rem" }} maw={720}>
        <Text>
          Вопрос {Math.min(attempt.index + 1, attempt.total)} из {attempt.total}
        </Text>
        {pause ? (
          <Alert color="fspRed" variant="light" title="Вопрос на паузе">
            <Stack gap="sm">
              <Text size="sm">{pauseTexts[pause]}</Text>
              <Button type="button" color="fspRed" onClick={onFullscreen}>
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
            hidden={pause !== null}
            sending={sending}
            onSubmit={(draft) => {
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
    </Group>
  );
};
