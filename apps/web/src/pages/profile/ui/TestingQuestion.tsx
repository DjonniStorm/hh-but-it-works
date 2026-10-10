import { useEffect, useState } from "react";

import {
  type AttemptItem,
  type Draft,
  emptyDraft,
} from "@/pages/profile/model/attempt";
import { useCountdown } from "@/pages/profile/model/use-countdown";
import { OrderAnswer } from "@/pages/profile/ui/OrderAnswer";
import { TestingChoice } from "@/pages/profile/ui/TestingChoice";
import { TestingCode } from "@/pages/profile/ui/TestingCode";
import { Button, Group, NumberInput, Stack, Text } from "@mantine/core";

const kindHints: Record<AttemptItem["kind"], string> = {
  single: "Один верный ответ. Клавиши 1–9, затем Enter.",
  code: "Прочитайте код. Клавиши 1–9, затем Enter.",
  multiple: "Отметьте все верные варианты.",
  numeric: "Введите число.",
  order: "Расставьте шаги по порядку.",
};

const choiceKey = /^[1-9]$/;

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
  const left = useCountdown(secondsLeft, () => {
    onSubmit(draft);
  });
  const ready =
    item.kind === "numeric" ? draft.value !== null : draft.choices.length > 0;
  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (hidden) {
        return;
      }
      if (event.key === "Enter") {
        if (!ready || sending || left === 0) {
          return;
        }
        event.preventDefault();
        onSubmit(draft);
        return;
      }
      // Только цифры 1–9: Number("Escape") — NaN, он проходит сравнения и попадает в ответ как null.
      if (!choiceKey.test(event.key)) {
        return;
      }
      const key = Number(event.key);
      if (key > item.choices.length) {
        return;
      }
      const index = key - 1;
      if (item.kind === "multiple") {
        event.preventDefault();
        // Цифра переключает вариант и не сбрасывает остальные.
        setDraft((current) => {
          const selected = current.choices.includes(index);
          return {
            choices: selected
              ? current.choices.filter((chosen) => {
                  return chosen !== index;
                })
              : [...current.choices, index],
            value: null,
          };
        });
        return;
      }
      if (item.kind !== "single" && item.kind !== "code") {
        return;
      }
      event.preventDefault();
      setDraft({ choices: [index], value: null });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [
    draft,
    hidden,
    item.choices.length,
    item.kind,
    left,
    onSubmit,
    ready,
    sending,
  ]);

  return (
    <Stack style={{ userSelect: "none" }} gap="md">
      <Text
        fz={48}
        lh={1}
        c={left <= 10 ? "fspRed" : undefined}
        aria-label={`Осталось ${left} секунд`}
      >
        {minutes}:{seconds}
      </Text>
      {hidden ? null : (
        <>
          <Group justify="space-between" gap="sm">
            <Text size="sm" c="dimmed">
              {kindHints[item.kind]}
            </Text>
            {item.kind === "multiple" ? (
              <Text size="sm">Выбрано {draft.choices.length}</Text>
            ) : null}
          </Group>
          <Text fz="lg">{item.prompt}</Text>
          {item.code ? <TestingCode code={item.code} lang={item.lang} /> : null}
          {item.kind === "single" || item.kind === "code" ? (
            <Stack gap="xs" role="radiogroup" aria-label={kindHints[item.kind]}>
              {item.choices.map((choice, index) => {
                return (
                  <TestingChoice
                    key={`${index}-${choice}`}
                    index={index}
                    mode="radio"
                    label={choice}
                    selected={draft.choices[0] === index}
                    onSelect={() => {
                      setDraft({ choices: [index], value: null });
                    }}
                  />
                );
              })}
            </Stack>
          ) : null}
          {item.kind === "multiple" ? (
            <Stack gap="xs" role="group" aria-label={kindHints.multiple}>
              {item.choices.map((choice, index) => {
                const selected = draft.choices.includes(index);
                return (
                  <TestingChoice
                    key={`${index}-${choice}`}
                    index={index}
                    mode="check"
                    label={choice}
                    selected={selected}
                    onSelect={() => {
                      setDraft({
                        choices: selected
                          ? draft.choices.filter((chosen) => {
                              return chosen !== index;
                            })
                          : [...draft.choices, index],
                        value: null,
                      });
                    }}
                  />
                );
              })}
            </Stack>
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
      {hidden ? null : (
        <Button
          type="button"
          disabled={!ready || left === 0}
          loading={sending}
          onClick={() => {
            onSubmit(draft);
          }}
        >
          Ответить и дальше
        </Button>
      )}
    </Stack>
  );
};
