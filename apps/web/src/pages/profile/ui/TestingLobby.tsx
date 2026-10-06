import {
  gradeOptions,
  optionLabel,
  skillLevelOptions,
  specializationOptions,
} from "@/pages/profile/model/options";
import { assessedFromProfile } from "@/pages/profile/model/save-skills";
import { SkillStatusBadge } from "@/pages/profile/ui/SkillStatusBadge";
import {
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";

export const TestingLobby = ({ profile }: { profile: CandidateProfile }) => {
  const contactsReady = Boolean(
    profile.displayName && profile.specialization && profile.claimedGrade,
  );
  const specialization = optionLabel(
    specializationOptions,
    profile.specialization,
  );
  const grade = optionLabel(gradeOptions, profile.claimedGrade);
  const skills = assessedFromProfile(profile.skills);

  return (
    <ScrollArea
      h="100%"
      type="auto"
      offsetScrollbars
      scrollbars="y"
      style={{ minHeight: 0 }}
    >
      <Paper shadow="md" withBorder p="xl" radius="md">
        <Stack>
          <Title order={3}>Тестирование</Title>
          {contactsReady ? (
            <Text>
              Специализация: {specialization}. Заявленный грейд: {grade}.
            </Text>
          ) : (
            <Text>Сначала сохраните анкету.</Text>
          )}
          {skills.length === 0 ? (
            <Text c="dimmed">Сначала добавьте навыки в анкете.</Text>
          ) : (
            skills.map((skill) => {
              const level = optionLabel(skillLevelOptions, skill.level);
              return (
                <Paper
                  key={skill.skillId ?? skill.title}
                  shadow="xs"
                  withBorder
                  p="sm"
                  radius="md"
                >
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text fw={600}>{skill.title}</Text>
                      {level ? (
                        <Text size="sm" c="dimmed">
                          {level}
                        </Text>
                      ) : null}
                    </Stack>
                    <SkillStatusBadge
                      level={skill.level}
                      verification={skill.verification}
                    />
                  </Group>
                </Paper>
              );
            })
          )}
          <Button disabled>Начать тест</Button>
          <Text c="dimmed">
            Тест на заявленный грейд ещё не запускается. Самооценка на биржу не
            выводит.
          </Text>
        </Stack>
      </Paper>
    </ScrollArea>
  );
};
