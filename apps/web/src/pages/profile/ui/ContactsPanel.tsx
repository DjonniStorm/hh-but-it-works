import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  gradeOptions,
  specializationOptions,
} from "@/pages/profile/model/options";
import {
  assessedFromProfile,
  saveSkills,
} from "@/pages/profile/model/save-skills";
import type { ContactValues } from "@/pages/profile/model/types";
import { ContactIcon } from "@/pages/profile/ui/ContactIcon";
import { ExpectationsFields } from "@/pages/profile/ui/ExpectationsFields";
import { VisibilityFields } from "@/pages/profile/ui/VisibilityFields";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import {
  Button,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";

import { type CandidateProfile, saveContactsSchema } from "@hh/contracts";
import { Grade, SearchStatus, Specialization, WorkFormat } from "@hh/types";

export const ContactsPanel = ({
  profile,
  email,
}: {
  profile: CandidateProfile;
  email: string;
}) => {
  const profiles = useStore(StoreKey.Profile);
  const form = useForm<ContactValues>({
    initialValues: {
      displayName: profile.displayName,
      specialization: profile.specialization ?? "",
      claimedGrade: profile.claimedGrade ?? "",
      fspId: profile.fspId ?? "",
      telegram: profile.telegram ?? "",
      github: profile.github ?? "",
      linkedin: profile.linkedin ?? "",
      website: profile.website ?? "",
      desiredSalaryFrom: profile.desiredSalaryFrom ?? "",
      // Обычный массив: у observable klona уходит в символ MobX и зацикливается.
      workFormats: profile.workFormats.slice(),
      searchStatus: profile.searchStatus,
      showExperience: profile.showExperience,
      showSalary: profile.showSalary,
      showFsp: profile.showFsp,
      showUnverifiedSkills: profile.showUnverifiedSkills,
    },
    validate: schemaResolver(saveContactsSchema, { sync: true }),
  });

  const onSubmit = form.onSubmit(
    (values) => {
      // Резолвер уже проверил специализацию и грейд. В типе формы они шире.
      void profiles.save(
        {
          displayName: values.displayName,
          specialization: values.specialization as Specialization,
          claimedGrade: values.claimedGrade as Grade,
          fspId: values.fspId,
          telegram: values.telegram,
          github: values.github,
          linkedin: values.linkedin,
          website: values.website,
          desiredSalaryFrom:
            values.desiredSalaryFrom === "" ? null : values.desiredSalaryFrom,
          workFormats: values.workFormats as WorkFormat[],
          searchStatus: values.searchStatus as SearchStatus,
          showExperience: values.showExperience,
          showSalary: values.showSalary,
          showFsp: values.showFsp,
          showUnverifiedSkills: values.showUnverifiedSkills,
          skills: saveSkills(assessedFromProfile(profile.skills)),
        },
        {
          onSuccess: () => {
            notifier.showSuccess("Контакты сохранены");
          },
        },
      );
    },
    (errors) => {
      focusFirstError(form, errors);
    },
  );

  return (
    <Paper
      component="form"
      onSubmit={onSubmit}
      shadow="md"
      withBorder
      p="xl"
      radius="md"
    >
      <Stack>
        <Title order={3}>Контакты</Title>
        <TextInput label="Почта" value={email} readOnly />
        <TextInput
          label="Имя"
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
          description="Сохраним здесь. Историю запросим при подтверждении перед биржей."
          {...form.getInputProps("fspId")}
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
        <ExpectationsFields form={form} />
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
