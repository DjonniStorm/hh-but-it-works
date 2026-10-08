import type { ContactValues } from "@/pages/profile/model/types";
import { mutedTextColor } from "@/shared/theme";
import { Stack, Switch, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

const fields = [
  ["showExperience", "Стаж"],
  ["showSalary", "Ожидаемая зарплата"],
  ["showFsp", "Достижения ФСП"],
  ["showUnverifiedSkills", "Неподтверждённые навыки"],
] as const;

export const VisibilityFields = ({
  form,
}: {
  form: UseFormReturnType<ContactValues>;
}) => {
  return (
    <Stack gap="xs">
      <Text fw={600}>Что видно в подборке</Text>
      <Text size="sm" style={{ color: mutedTextColor }}>
        Выключенное работодатель не видит. Подтверждённые навыки остаются. Имя
        открывается только после принятия приглашения.
      </Text>
      {fields.map(([key, label]) => {
        return (
          <Switch
            key={key}
            label={label}
            {...form.getInputProps(key, { type: "checkbox" })}
          />
        );
      })}
    </Stack>
  );
};
