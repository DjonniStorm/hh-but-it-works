import type {
  ProfileForm,
  ProfileSubmit,
} from "@/pages/profile/model/use-profile-form";
import { EducationFields } from "@/pages/profile/ui/EducationFields";
import { Button, Paper, Stack, Title } from "@mantine/core";

export const EducationPanel = ({
  form,
  submit,
}: {
  form: ProfileForm;
  submit: ProfileSubmit;
}) => {
  return (
    <Paper
      component="form"
      onSubmit={submit("Образование сохранено")}
      shadow="md"
      withBorder
      p="xl"
      radius="md"
    >
      <Stack>
        <Title order={3}>Образование</Title>
        <EducationFields form={form} />
        <Button type="submit">Сохранить образование</Button>
      </Stack>
    </Paper>
  );
};
