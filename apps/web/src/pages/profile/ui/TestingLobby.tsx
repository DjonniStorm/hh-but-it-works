import { useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import type { ActiveAttempt } from "@/pages/profile/model/attempt";
import {
  allowedGrades,
  defaultTestGrade,
} from "@/pages/profile/model/grade-advice";
import {
  gradeOptions,
  optionLabel,
  skillLevelOptions,
  specializationOptions,
} from "@/pages/profile/model/options";
import { startAttempt } from "@/pages/profile/model/run-attempt";
import { assessedFromProfile } from "@/pages/profile/model/save-skills";
import { CategoryCard } from "@/pages/profile/ui/CategoryCard";
import { SkillStatusBadge } from "@/pages/profile/ui/SkillStatusBadge";
import { TestingRules } from "@/pages/profile/ui/TestingRules";
import { Button, Group, Select, Stack, Text } from "@mantine/core";

import type { CandidateProfile } from "@hh/contracts";
import { Grade } from "@hh/types";

export const TestingLobby = ({
  profile,
  onStarted,
}: {
  profile: CandidateProfile;
  onStarted: (attempt: ActiveAttempt) => void;
}) => {
  const root = useRootStore();
  const contactsReady = Boolean(
    profile.displayName && profile.specialization && profile.claimedGrade,
  );
  const specialization = optionLabel(
    specializationOptions,
    profile.specialization,
  );
  const skills = assessedFromProfile(profile.skills);
  const allowed = allowedGrades(profile);
  const [grade, setGrade] = useState<Grade>(defaultTestGrade(profile));
  const [agreed, setAgreed] = useState(false);

  return (
    <Stack gap="lg">
      <CategoryCard profile={profile} />
      <Stack gap="sm">
        {contactsReady ? (
          <Text>
            Специализация {specialization}. В попытку войдут обязательные темы и
            навыки из анкеты, у каждого своя секция.
          </Text>
        ) : (
          <Text>Сначала сохраните анкету.</Text>
        )}
        {skills.length === 0 ? (
          <Text c="dimmed">
            Навыков в анкете нет: попытка будет только по ядру специализации.
          </Text>
        ) : (
          skills.map((skill) => {
            const level = optionLabel(skillLevelOptions, skill.level);
            return (
              <Group
                key={skill.skillId ?? skill.title}
                justify="space-between"
                wrap="nowrap"
              >
                <Stack gap={0}>
                  <Text>{skill.title}</Text>
                  {level ? (
                    <Text size="sm" c="dimmed">
                      {level}
                    </Text>
                  ) : null}
                </Stack>
                <SkillStatusBadge
                  level={skill.level}
                  verification={skill.verification}
                  verifiedAt={skill.verifiedAt}
                />
              </Group>
            );
          })
        )}
        <Select
          label="Грейд теста"
          description={
            allowed.length === 1
              ? "Пока идёт пауза между сменами грейда, доступна пересдача на текущий."
              : undefined
          }
          data={gradeOptions.map((option) => {
            return { ...option, disabled: !allowed.includes(option.value) };
          })}
          value={grade}
          allowDeselect={false}
          onChange={(value) => {
            if (
              value === Grade.Junior ||
              value === Grade.Middle ||
              value === Grade.Senior
            ) {
              setGrade(value);
            }
          }}
          disabled={!contactsReady}
        />
        <TestingRules agreed={agreed} onAgree={setAgreed} />
        <Button
          type="button"
          disabled={!contactsReady || !agreed || !allowed.includes(grade)}
          onClick={() => {
            void startAttempt(root, grade, { onSuccess: onStarted }).catch(
              () => {
                return undefined;
              },
            );
          }}
        >
          Начать попытку на {optionLabel(gradeOptions, grade)}
        </Button>
      </Stack>
    </Stack>
  );
};
