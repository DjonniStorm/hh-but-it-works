import type {
  ProfileForm,
  ProfileSubmit,
} from "@/pages/profile/model/use-profile-form";
import { ExperienceFields } from "@/pages/profile/ui/ExperienceFields";
import { Button, Paper, Stack, Title } from "@mantine/core";

export const ExperiencePanel = ({
  form,
  submit,
}: {
  form: ProfileForm;
  submit: ProfileSubmit;
}) => {
  return (
    <Paper
      component="form"
      onSubmit={submit("Опыт работы сохранён")}
      shadow="md"
      withBorder
      p="xl"
      radius="md"
    >
      <Stack>
        <Title order={3}>Опыт работы</Title>
        <ExperienceFields form={form} />
        <Button type="submit">Сохранить опыт</Button>
      </Stack>
    </Paper>
  );
};
