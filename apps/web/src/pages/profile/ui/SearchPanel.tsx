import type {
  ProfileForm,
  ProfileSubmit,
} from "@/pages/profile/model/use-profile-form";
import { ExpectationsFields } from "@/pages/profile/ui/ExpectationsFields";
import { Button, Paper, Stack, Title } from "@mantine/core";

// Стаж, вилка, форматы и статус поиска: всё, по чему работодатель фильтрует подборку.
export const SearchPanel = ({
  form,
  submit,
}: {
  form: ProfileForm;
  submit: ProfileSubmit;
}) => {
  return (
    <Paper
      component="form"
      onSubmit={submit("Поиск работы сохранён")}
      shadow="md"
      withBorder
      p="xl"
      radius="md"
    >
      <Stack>
        <Title order={3}>Поиск работы</Title>
        <ExpectationsFields form={form} />
        <Button type="submit">Сохранить поиск работы</Button>
      </Stack>
    </Paper>
  );
};
