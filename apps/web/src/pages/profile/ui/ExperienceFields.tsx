import { blankExperience } from "@/pages/profile/model/resume-history";
import type { ContactValues } from "@/pages/profile/model/types";
import { mutedTextColor } from "@/shared/theme";
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

export const ExperienceFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  return (
    <Stack gap="sm">
      <Text fw={600}>Опыт работы</Text>
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
              <TextInput
                label="Компания"
                {...form.getInputProps(`experience.${index}.company`)}
              />
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
                  description="Пустое — по настоящее время"
                  min={1950}
                  max={2035}
                  decimalScale={0}
                  {...form.getInputProps(`experience.${index}.toYear`)}
                />
              </Group>
              <Textarea
                label="Чем занимались"
                minRows={2}
                autosize
                {...form.getInputProps(`experience.${index}.summary`)}
              />
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  form.removeListItem("experience", index);
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
