import { blankExperience } from "@/pages/profile/model/resume-history";
import type { ContactValues } from "@/pages/profile/model/types";
import { mutedTextColor } from "@/shared/theme";
import {
  Button,
  CloseButton,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

export const ExperienceFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  return (
    <Stack gap="sm">
      <Text size="sm" style={{ color: mutedTextColor }}>
        Это не число стажа. Строки видны в PDF, работодатель в подборке их не
        видит.
      </Text>
      {form.values.experience.length === 0 ? (
        <Text size="sm" style={{ color: mutedTextColor }}>
          Пока пусто.
        </Text>
      ) : (
        form.values.experience.map((_, index) => {
          return (
            <Stack key={index} gap="xs">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <TextInput
                  label="Компания"
                  style={{ flex: 1, minWidth: 0 }}
                  {...form.getInputProps(`experience.${index}.company`)}
                />
                {/* Крестик в углу блока, а не кнопка после полей: так его не спутать с «Добавить место» */}
                <Tooltip label="Убрать" withArrow>
                  <CloseButton
                    type="button"
                    size="lg"
                    aria-label="Убрать место работы"
                    onClick={() => {
                      form.removeListItem("experience", index);
                    }}
                  />
                </Tooltip>
              </Group>
              <TextInput
                label="Должность"
                {...form.getInputProps(`experience.${index}.role`)}
              />
              <Group grow>
                <NumberInput
                  label="С"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`experience.${index}.fromYear`)}
                />
                <NumberInput
                  label="По"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`experience.${index}.toYear`)}
                />
              </Group>
              {/* Подсказка строкой под парой: description у «По» делал блок выше, и инпуты уезжали с одной линии */}
              <Text size="sm" style={{ color: mutedTextColor }}>
                Пустой год «По» — по настоящее время.
              </Text>
              <Textarea
                label="Чем занимались"
                minRows={2}
                autosize
                {...form.getInputProps(`experience.${index}.summary`)}
              />
            </Stack>
          );
        })
      )}
      <Button
        type="button"
        variant="default"
        disabled={form.values.experience.length >= 12}
        onClick={() => {
          form.insertListItem("experience", blankExperience());
        }}
      >
        Добавить место
      </Button>
    </Stack>
  );
};
