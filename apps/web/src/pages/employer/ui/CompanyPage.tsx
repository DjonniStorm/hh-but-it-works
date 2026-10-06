import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { industryOptions } from "@/pages/employer/model/options";
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";

import { companyProfileSchema } from "@hh/contracts";

const emptyCompany = {
  name: "",
  industry: "",
  description: "",
  website: "",
  contactEmail: "",
  contactTelegram: "",
};

export const CompanyPage = observer(() => {
  const employer = useStore(StoreKey.Employer);
  // Раскладка рендерит страницу после загрузки профиля, поэтому начальные значения уже актуальны.
  const form = useForm({
    initialValues: employer.company ?? emptyCompany,
    validate: schemaResolver(companyProfileSchema, { sync: true }),
  });

  const onSubmit = form.onSubmit((values) => {
    void employer.saveCompany(values, {
      onSuccess: (company) => {
        form.resetDirty(company);
        notifier.showSuccess("Профиль компании сохранён");
      },
    });
  });

  return (
    <Stack gap="lg" maw={860}>
      <Stack gap={4}>
        <Title order={2}>Профиль компании</Title>
        <Text c="dimmed" size="sm">
          Кандидат видит название, описание и способ связи в каждом приглашении.
        </Text>
      </Stack>

      <Paper component="form" onSubmit={onSubmit} withBorder radius="md" p="xl">
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Название" {...form.getInputProps("name")} />
            <Select
              label="Направление деятельности"
              placeholder="Выберите"
              data={industryOptions}
              searchable
              {...form.getInputProps("industry")}
            />
          </SimpleGrid>
          <Textarea
            label="О компании"
            description="Продукт, команда, чем интересны задачи."
            autosize
            minRows={4}
            {...form.getInputProps("description")}
          />
          <TextInput
            label="Сайт"
            placeholder="https://"
            {...form.getInputProps("website")}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Почта для связи"
              {...form.getInputProps("contactEmail")}
            />
            <TextInput
              label="Telegram"
              placeholder="@company_hr"
              {...form.getInputProps("contactTelegram")}
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button type="submit" disabled={!form.isDirty()}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
});
