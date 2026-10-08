import type { NeedFormValues } from "@/pages/employer/model/need-form";
import { skillSuggestions } from "@/pages/employer/model/options";
import { SalaryFields } from "@/pages/employer/ui/SalaryFields";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import {
  gradeOptions,
  specializationOptions,
  workFormatOptions,
} from "@/shared/lib/labels";
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  TextInput,
  Textarea,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { Link } from "react-router";

import { type HiringNeedInput, hiringNeedInputSchema } from "@hh/contracts";

type Props = {
  initialValues: NeedFormValues;
  submitLabel: string;
  cancelTo: string;
  onSubmit: (input: HiringNeedInput) => void;
};

// Одна форма на создание и редактирование: поля и проверки не разойдутся.
export const NeedForm = ({
  initialValues,
  submitLabel,
  cancelTo,
  onSubmit,
}: Props) => {
  const form = useForm({
    initialValues,
    validate: schemaResolver(hiringNeedInputSchema, { sync: true }),
  });

  const submit = form.onSubmit(
    (values) => {
      // Резолвер уже проверил значения. В типе формы пустые поля шире, чем HiringNeedInput.
      onSubmit(values as HiringNeedInput);
    },
    (errors) => {
      focusFirstError(form, errors);
    },
  );

  return (
    <Paper component="form" onSubmit={submit} withBorder radius="md" p="xl">
      <Stack gap="lg">
        <TextInput
          label="Название"
          withAsterisk
          placeholder="Например, Backend-разработчик в платёжную команду"
          {...form.getInputProps("title")}
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Специализация"
            withAsterisk
            placeholder="Выберите"
            data={specializationOptions}
            {...form.getInputProps("specialization")}
          />
          <Select
            label="Грейд от"
            withAsterisk
            data={gradeOptions}
            allowDeselect={false}
            {...form.getInputProps("gradeFrom")}
          />
          <Select
            label="Грейд до"
            withAsterisk
            data={gradeOptions}
            allowDeselect={false}
            {...form.getInputProps("gradeTo")}
          />
        </SimpleGrid>

        <TagsInput
          label="Обязательные навыки"
          withAsterisk
          description="Без них кандидат не справится. Enter — добавить свой."
          data={skillSuggestions}
          clearable
          {...form.getInputProps("mustSkills")}
        />
        <TagsInput
          label="Желательные навыки"
          description="Дают бонус в ранжировании, но не обязательны."
          data={skillSuggestions}
          clearable
          {...form.getInputProps("niceSkills")}
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Формат работы"
            withAsterisk
            data={workFormatOptions}
            allowDeselect={false}
            {...form.getInputProps("workFormat")}
          />
          <SalaryFields
            fromProps={form.getInputProps("salaryFrom")}
            toProps={form.getInputProps("salaryTo")}
          />
        </SimpleGrid>

        <Textarea
          label="Чем занимается команда"
          description="Увидит кандидат в приглашении. Можно оставить пустым."
          autosize
          minRows={3}
          {...form.getInputProps("description")}
        />

        <Group justify="flex-end">
          <Button variant="default" component={Link} to={cancelTo}>
            Отмена
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </Group>
      </Stack>
    </Paper>
  );
};
