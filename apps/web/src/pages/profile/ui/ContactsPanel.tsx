import {
  gradeOptions,
  specializationOptions,
} from "@/pages/profile/model/options";
import type {
  ProfileForm,
  ProfileSubmit,
} from "@/pages/profile/model/use-profile-form";
import { ContactIcon } from "@/pages/profile/ui/ContactIcon";
import { FspPanel } from "@/pages/profile/ui/FspPanel";
import { ProfileDownload } from "@/pages/profile/ui/ProfileDownload";
import { ResumeUpload } from "@/pages/profile/ui/ResumeUpload";
import { VisibilityFields } from "@/pages/profile/ui/VisibilityFields";
import { mutedTextColor } from "@/shared/theme";
import {
  Button,
  Paper,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

// Первая плитка анкеты: кто кандидат, как с ним связаться и что видно в подборке.
export const ContactsPanel = ({
  profile,
  email,
  form,
  submit,
}: {
  profile: CandidateProfile;
  email: string;
  form: ProfileForm;
  submit: ProfileSubmit;
}) => {
  return (
    <Paper
      component="form"
      onSubmit={submit("Контакты сохранены")}
      shadow="md"
      withBorder
      p="xl"
      radius="md"
    >
      <Stack>
        <Title order={3}>Контакты</Title>
        <ResumeUpload />
        <ProfileDownload />
        <Text size="sm" style={{ color: mutedTextColor }}>
          PDF заполняет форму и ничего не сохраняет. Скачивается уже сохранённая
          анкета.
        </Text>
        <TextInput label="Почта" value={email} readOnly />
        <TextInput
          label="ФИО"
          autoComplete="name"
          withAsterisk
          {...form.getInputProps("displayName")}
        />
        <Select
          label="Специализация"
          withAsterisk
          data={specializationOptions}
          {...form.getInputProps("specialization")}
        />
        <Select
          label="Заявленный грейд"
          withAsterisk
          data={gradeOptions}
          {...form.getInputProps("claimedGrade")}
        />
        <TextInput
          label="ID участника ФСП"
          description="По нему показываем историю достижений. Найти себя по почте можно ниже."
          {...form.getInputProps("fspId")}
        />
        <FspPanel profile={profile} />
        <TextInput
          label="Телефон"
          type="tel"
          autoComplete="tel"
          placeholder="+7 (900) 000-00-00"
          {...form.getInputProps("phone")}
        />
        <TextInput
          label="Telegram"
          placeholder="@username или t.me/..."
          leftSection={<ContactIcon kind="telegram" />}
          {...form.getInputProps("telegram")}
        />
        <TextInput
          label="GitHub"
          placeholder="github.com/username"
          leftSection={<ContactIcon kind="github" />}
          {...form.getInputProps("github")}
        />
        <TextInput
          label="LinkedIn"
          placeholder="linkedin.com/in/..."
          leftSection={<ContactIcon kind="linkedin" />}
          {...form.getInputProps("linkedin")}
        />
        <TextInput
          label="Сайт"
          placeholder="https://"
          leftSection={<ContactIcon kind="website" />}
          {...form.getInputProps("website")}
        />
        <TagsInput
          label="Софт-скиллы"
          description="Enter после каждого качества. Подборка их не учитывает."
          maxTags={20}
          {...form.getInputProps("softSkills")}
        />
        <VisibilityFields form={form} />
        <Text>
          {profile.listed
            ? "Профиль на бирже."
            : "Пока не на бирже. Туда попадёте после подтверждения."}
        </Text>
        <Button type="submit">Сохранить контакты</Button>
      </Stack>
    </Paper>
  );
};
