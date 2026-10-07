import { useState } from "react";

import {
  type AttemptItem,
  type Draft,
  emptyDraft,
} from "@/pages/profile/model/attempt";
import { useCountdown } from "@/pages/profile/model/use-countdown";
import { OrderAnswer } from "@/pages/profile/ui/OrderAnswer";
import {
  Badge,
  Button,
  Checkbox,
  Code,
  Group,
  NumberInput,
  Radio,
  Stack,
  Text,
} from "@mantine/core";

const kindHints: Record<AttemptItem["kind"], string> = {
  single: "Один верный ответ",
  code: "Прочитайте код, один верный ответ",
  multiple: "Отметьте все верные варианты",
  numeric: "Введите число",
  order: "Расставьте шаги по порядку",
};

export const TestingQuestion = ({
  item,
  secondsLeft,
  hidden,
  sending,
  onSubmit,
}: {
  item: AttemptItem;
  secondsLeft: number;
  hidden: boolean;
  sending: boolean;
  onSubmit: (draft: Draft) => void;
}) => {
  const [draft, setDraft] = useState<Draft>(
    item.kind === "order"
      ? {
          choices: item.choices.map((_, index) => {
            return index;
          }),
          value: null,
        }
      : emptyDraft,
  );
  // Время вышло — отправляем то, что успели выбрать. Сервер засчитает поздний ответ неверным.
  const left = useCountdown(secondsLeft, () => {
    onSubmit(draft);
  });
  const ready =
    item.kind === "numeric" ? draft.value !== null : draft.choices.length > 0;

  return (
    <Stack style={{ userSelect: "none" }}>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {kindHints[item.kind]}
        </Text>
        <Badge color={left <= 10 ? "red" : "gray"} variant="light" size="lg">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </Badge>
      </Group>
      {hidden ? null : (
        <>
          <Text fw={600}>{item.prompt}</Text>
          {item.code ? <Code block>{item.code}</Code> : null}
          {item.kind === "single" || item.kind === "code" ? (
            <Radio.Group
              value={
                draft.choices[0] === undefined ? null : String(draft.choices[0])
              }
              onChange={(value) => {
                setDraft({ choices: [Number(value)], value: null });
              }}
            >
              <Stack gap="xs">
                {item.choices.map((choice, index) => {
                  return (
                    <Radio key={choice} value={String(index)} label={choice} />
                  );
                })}
              </Stack>
            </Radio.Group>
          ) : null}
          {item.kind === "multiple" ? (
            <Checkbox.Group
              value={draft.choices.map(String)}
              onChange={(values) => {
                setDraft({ choices: values.map(Number), value: null });
              }}
            >
              <Stack gap="xs">
                {item.choices.map((choice, index) => {
                  return (
                    <Checkbox
                      key={choice}
                      value={String(index)}
                      label={choice}
                    />
                  );
                })}
              </Stack>
            </Checkbox.Group>
          ) : null}
          {item.kind === "numeric" ? (
            <NumberInput
              label="Ответ"
              value={draft.value ?? ""}
              allowDecimal={false}
              onChange={(value) => {
                setDraft({
                  choices: [],
                  value: typeof value === "number" ? value : null,
                });
              }}
            />
          ) : null}
          {item.kind === "order" ? (
            <OrderAnswer
              steps={item.choices}
              order={draft.choices}
              onChange={(order) => {
                setDraft({ choices: order, value: null });
              }}
            />
          ) : null}
        </>
      )}
      <Button
        type="button"
        disabled={!ready || hidden || left === 0}
        loading={sending}
        onClick={() => {
          onSubmit(draft);
        }}
      >
        Ответить и дальше
      </Button>
    </Stack>
  );
};
