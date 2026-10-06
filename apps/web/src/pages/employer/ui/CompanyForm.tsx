import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { industryOptions } from "@/pages/employer/model/options";
import { websiteOnBlur, websiteOnFocus } from "@/pages/employer/model/website";
import {
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { observer } from "mobx-react-lite";

import { type CompanyProfile, companyProfileSchema } from "@hh/contracts";

type Props = {
  initial: CompanyProfile;
  submitLabel: string;
  onSaved: (company: CompanyProfile) => void;
  // Нет при первом заполнении: отменять нечего, профиля ещё нет.
  onCancel?: () => void;
};

export const CompanyForm = observer(
  ({ initial, submitLabel, onSaved, onCancel }: Props) => {
    const employer = useStore(StoreKey.Employer);
    const form = useForm({
      initialValues: initial,
      validate: schemaResolver(companyProfileSchema, { sync: true }),
    });
    const websiteProps = form.getInputProps("website");

    const onSubmit = form.onSubmit((values) => {
      void employer.saveCompany(values, { onSuccess: onSaved });
    });

    return (
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
            {...websiteProps}
            onFocus={(event) => {
              form.setFieldValue(
                "website",
                websiteOnFocus(form.values.website),
              );
              websiteProps.onFocus?.(event);
            }}
            onBlur={(event) => {
              form.setFieldValue("website", websiteOnBlur(form.values.website));
              websiteProps.onBlur?.(event);
            }}
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
            {onCancel ? (
              <Button variant="default" onClick={onCancel}>
                Отмена
              </Button>
            ) : null}
            <Button type="submit">{submitLabel}</Button>
          </Group>
        </Stack>
      </Paper>
    );
  },
);
