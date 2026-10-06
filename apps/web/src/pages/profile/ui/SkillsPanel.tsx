import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import {
  assessedFromProfile,
  saveSkills,
} from "@/pages/profile/model/save-skills";
import type { SkillRow, SkillsFormValues } from "@/pages/profile/model/types";
import { AssessedSkill } from "@/pages/profile/ui/AssessedSkill";
import { SkillSearch } from "@/pages/profile/ui/SkillSearch";
import { Accordion, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";

import { type CandidateProfile, saveSkillsSchema } from "@hh/contracts";

export const SkillsPanel = ({ profile }: { profile: CandidateProfile }) => {
  const profiles = useStore(StoreKey.Profile);
  const form = useForm<SkillsFormValues>({
    initialValues: {
      skills: assessedFromProfile(profile.skills),
    },
    validate: schemaResolver(saveSkillsSchema, { sync: true }),
  });
  const contactsReady = Boolean(
    profile.displayName && profile.specialization && profile.claimedGrade,
  );

  const onSubmit = form.onSubmit((values) => {
    if (
      !profile.displayName ||
      !profile.specialization ||
      !profile.claimedGrade
    ) {
      notifier.showError("Сначала сохраните контакты");
      return;
    }
    void profiles.save(
      {
        displayName: profile.displayName,
        specialization: profile.specialization,
        claimedGrade: profile.claimedGrade,
        fspId: profile.fspId ?? "",
        telegram: profile.telegram ?? "",
        github: profile.github ?? "",
        linkedin: profile.linkedin ?? "",
        website: profile.website ?? "",
        skills: saveSkills(values.skills),
      },
      {
        onSuccess: () => {
          notifier.showSuccess("Навыки сохранены");
        },
      },
    );
  });

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
        <Title order={3}>Навыки</Title>
        <Accordion variant="contained">
          <Accordion.Item value="add">
            <Accordion.Control>Добавить навык</Accordion.Control>
            <Accordion.Panel>
              <SkillSearch
                catalog={profile.skills.map((skill) => {
                  return { skillId: skill.skillId, title: skill.title };
                })}
                takenTitles={form.values.skills.map((skill) => {
                  return skill.title;
                })}
                onAdd={(draft) => {
                  form.insertListItem(
                    "skills",
                    {
                      skillId: draft.skillId,
                      title: draft.title,
                      level: draft.level,
                      verification: null,
                    } satisfies SkillRow,
                    0,
                  );
                }}
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        {form.values.skills.length === 0 ? (
          <Text c="dimmed">Пока пусто. Откройте «Добавить навык».</Text>
        ) : (
          form.values.skills.map((skill, index) => {
            return (
              <AssessedSkill
                key={skill.skillId ?? skill.title}
                skill={skill}
                levelProps={form.getInputProps(`skills.${index}.level`)}
                onRemove={() => {
                  form.removeListItem("skills", index);
                }}
              />
            );
          })
        )}
        <Button type="submit" disabled={!contactsReady}>
          Сохранить навыки
        </Button>
        {contactsReady ? null : (
          <Text c="dimmed">Сначала сохраните контакты.</Text>
        )}
      </Stack>
    </Paper>
  );
};
