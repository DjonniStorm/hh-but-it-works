import { blankEducation } from "@/pages/profile/model/resume-history";
import type { ContactValues } from "@/pages/profile/model/types";
import { mutedTextColor } from "@/shared/theme";
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

export const EducationFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  return (
    <Stack gap="sm">
      <Text fw={600}>Образование</Text>
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
              <TextInput
                label="Учебное заведение"
                {...form.getInputProps(`education.${index}.school`)}
              />
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
                  description="Пустое — по настоящее время"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`education.${index}.toYear`)}
                />
              </Group>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  form.removeListItem("education", index);
                }}
              >
                Убрать
              </Button>
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
