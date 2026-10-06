import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { skillSuggestions } from "@/pages/employer/model/options";
import { BackToNeeds } from "@/pages/employer/ui/BackToNeeds";
import { SalaryFields } from "@/pages/employer/ui/SalaryFields";
import {
  gradeOptions,
  specializationOptions,
  workFormatOptions,
} from "@/shared/lib/labels";
import { ROUTES, needPath } from "@/shared/router/routes";
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router";

import { type HiringNeedInput, hiringNeedInputSchema } from "@hh/contracts";
import { Grade, type Specialization, WorkFormat } from "@hh/types";

export const NeedNewPage = observer(() => {
  const employer = useStore(StoreKey.Employer);
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      title: "",
      specialization: null as Specialization | null,
      gradeFrom: Grade.Junior as Grade | null,
      gradeTo: Grade.Middle as Grade | null,
      mustSkills: [] as string[],
      niceSkills: [] as string[],
      workFormat: WorkFormat.Remote as WorkFormat | null,
      salaryFrom: "" as number | "",
      salaryTo: "" as number | "",
      description: "",
    },
    validate: schemaResolver(hiringNeedInputSchema, { sync: true }),
  });

  const onSubmit = form.onSubmit((values) => {
    // Резолвер уже проверил значения. В типе формы пустые поля шире, чем ждёт createNeed.
    void employer.createNeed(values as HiringNeedInput, {
      onSuccess: (need) => {
        navigate(needPath(need.id));
      },
    });
  });

  return (
    <Stack gap="lg" maw={860}>
      <Stack gap={4}>
        <BackToNeeds />
        <Title order={2}>Кого вы ищете?</Title>
        <Text c="dimmed" size="sm">
          Подборка строится по категории кандидатов (специализация и
          подтверждённый грейд), а не по ключевым словам резюме.
        </Text>
      </Stack>

      <Paper component="form" onSubmit={onSubmit} withBorder radius="md" p="xl">
        <Stack gap="lg">
          <TextInput
            label="Название"
            placeholder="Например, Backend-разработчик в платёжную команду"
            {...form.getInputProps("title")}
          />

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Select
              label="Специализация"
              placeholder="Выберите"
              data={specializationOptions}
              {...form.getInputProps("specialization")}
            />
            <Select
              label="Грейд от"
              data={gradeOptions}
              allowDeselect={false}
              {...form.getInputProps("gradeFrom")}
            />
            <Select
              label="Грейд до"
              data={gradeOptions}
              allowDeselect={false}
              {...form.getInputProps("gradeTo")}
            />
          </SimpleGrid>

          <TagsInput
            label="Обязательные навыки"
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
            <Button
              variant="default"
              component={Link}
              to={ROUTES.EMPLOYER.NEEDS}
            >
              Отмена
            </Button>
            <Button type="submit">Собрать подборку</Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
});
