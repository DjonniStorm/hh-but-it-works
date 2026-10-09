import { blankEducation } from "@/pages/profile/model/resume-history";
import type { ContactValues } from "@/pages/profile/model/types";
import { useSchools } from "@/pages/profile/model/use-schools";
import { mutedTextColor } from "@/shared/theme";
import {
  Autocomplete,
  Button,
  CloseButton,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

// Сколько подсказок показывать: вузов и колледжей тысячи, дюжина вариантов хватает.
const SUGGESTION_LIMIT = 10;

export const EducationFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  const schools = useSchools();

  return (
    <Stack gap="sm">
      <Text size="sm" style={{ color: mutedTextColor }}>
        В подборку не попадает. Попадёт в PDF после сохранения.
      </Text>
      {form.values.education.length === 0 ? (
        <Text size="sm" style={{ color: mutedTextColor }}>
          Пока пусто.
        </Text>
      ) : (
        form.values.education.map((_, index) => {
          return (
            <Stack key={index} gap="xs">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Autocomplete
                  label="Учебное заведение"
                  placeholder="Начните вводить название"
                  data={schools}
                  limit={SUGGESTION_LIMIT}
                  style={{ flex: 1, minWidth: 0 }}
                  {...form.getInputProps(`education.${index}.school`)}
                />
                {/* Крестик в углу блока, а не кнопка после полей: так его не спутать с «Добавить образование» */}
                <Tooltip label="Убрать" withArrow>
                  <CloseButton
                    type="button"
                    size="lg"
                    aria-label="Убрать образование"
                    onClick={() => {
                      form.removeListItem("education", index);
                    }}
                  />
                </Tooltip>
              </Group>
              <TextInput
                label="Программа"
                {...form.getInputProps(`education.${index}.program`)}
              />
              <Group grow>
                <NumberInput
                  label="С"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`education.${index}.fromYear`)}
                />
                <NumberInput
                  label="По"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`education.${index}.toYear`)}
                />
              </Group>
              {/* Подсказка строкой под парой: description у «По» делал блок выше, и инпуты уезжали с одной линии */}
              <Text size="sm" style={{ color: mutedTextColor }}>
                Пустой год «По» — по настоящее время.
              </Text>
            </Stack>
          );
        })
      )}
      <Button
        type="button"
        variant="default"
        disabled={form.values.education.length >= 8}
        onClick={() => {
          form.insertListItem("education", blankEducation());
        }}
      >
        Добавить образование
      </Button>
    </Stack>
  );
};
