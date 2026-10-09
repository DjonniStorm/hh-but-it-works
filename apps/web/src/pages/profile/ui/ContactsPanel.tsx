import { useEffect, useRef } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { applyContactDraft } from "@/pages/profile/model/apply-resume-draft";
import {
  gradeOptions,
  specializationOptions,
} from "@/pages/profile/model/options";
import {
  educationFromProfile,
  experienceFromProfile,
} from "@/pages/profile/model/resume-history";
import { contactInput } from "@/pages/profile/model/save-contacts";
import {
  assessedFromProfile,
  saveSkills,
} from "@/pages/profile/model/save-skills";
import type {
  ContactValues,
  ResumeDraftHit,
} from "@/pages/profile/model/types";
import { ContactIcon } from "@/pages/profile/ui/ContactIcon";
import { EducationFields } from "@/pages/profile/ui/EducationFields";
import { ExpectationsFields } from "@/pages/profile/ui/ExpectationsFields";
import { ExperienceFields } from "@/pages/profile/ui/ExperienceFields";
import { ProfileDownload } from "@/pages/profile/ui/ProfileDownload";
import { ResumeUpload } from "@/pages/profile/ui/ResumeUpload";
import { VisibilityFields } from "@/pages/profile/ui/VisibilityFields";
import { focusFirstError } from "@/shared/lib/focus-first-error";
import { mutedTextColor } from "@/shared/theme";
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

export const ContactsPanel = ({
  profile,
  email,
  draft,
}: {
  profile: CandidateProfile;
  email: string;
  draft: ResumeDraftHit | null;
}) => {
  const profiles = useStore(StoreKey.Profile);
  const seenDraft = useRef<number | null>(null);
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
      experienceYears: profile.experienceYears ?? "",
      education: educationFromProfile(profile.education),
      experience: experienceFromProfile(profile.experience),
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
      const skills =
        profiles.readSkills?.() ?? assessedFromProfile(profile.skills);
      void profiles.save(
        {
          ...contactInput(values),
          skills: saveSkills(skills),
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

  useEffect(() => {
    profiles.bindContacts(() => {
      return form.getValues();
    });
    return () => {
      profiles.bindContacts(null);
    };
  }, [form, profiles]);

  useEffect(() => {
    if (!draft || seenDraft.current === draft.at) {
      return;
    }
    seenDraft.current = draft.at;
    applyContactDraft(form, draft.draft, profile.verifiedGrade);
  }, [draft, form, profile.verifiedGrade]);

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
        <ResumeUpload />
        <ProfileDownload />
        <Text size="sm" style={{ color: mutedTextColor }}>
          PDF заполняет форму и ничего не сохраняет. Скачивается уже сохранённая
          анкета.
        </Text>
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
        <EducationFields form={form} />
        <ExperienceFields form={form} />
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
