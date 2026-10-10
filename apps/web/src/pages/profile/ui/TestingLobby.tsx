import { useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import type { ActiveAttempt } from "@/pages/profile/model/attempt";
import { attemptPlan, sectionIsCore } from "@/pages/profile/model/attempt-plan";
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
  const plan = attemptPlan(profile.specialization, profile.skills);
  const profileSkills = profile.skills.filter((skill) => {
    return skill.level;
  });
  const allowed = allowedGrades(profile);
  const [grade, setGrade] = useState<Grade>(defaultTestGrade(profile));
  const [agreed, setAgreed] = useState(false);

  return (
    <Stack gap="lg">
      <CategoryCard profile={profile} />
      <Stack gap="sm">
        {contactsReady ? (
          <>
            <Text>
              Специализация {specialization}. В попытке будут такие секции.
            </Text>
            {plan.sections.map((section) => {
              const level = optionLabel(skillLevelOptions, section.level);
              return (
                <Group key={section.key} justify="space-between" wrap="nowrap">
                  <Stack gap={0}>
                    <Text>{section.title}</Text>
                    {sectionIsCore(profile.specialization, section.key) ? (
                      <Text size="sm" c="dimmed">
                        ядро специализации
                      </Text>
                    ) : null}
                    {level ? (
                      <Text size="sm" c="dimmed">
                        {level}
                      </Text>
                    ) : null}
                  </Stack>
                  {section.inProfile ? (
                    <SkillStatusBadge
                      level={section.level}
                      verification={section.verification}
                      verifiedAt={section.verifiedAt}
                      tested
                    />
                  ) : null}
                </Group>
              );
            })}
            {profileSkills.length === 0 ? (
              <Text c="dimmed">
                Навыков в анкете нет: попытка будет только по ядру
                специализации.
              </Text>
            ) : null}
            {plan.proxies.map((skill) => {
              return (
                <Text key={skill.slug}>
                  {skill.title} — своих вопросов нет, проверим {skill.via},{" "}
                  {skill.title} останется неподтверждённым
                </Text>
              );
            })}
            {plan.untested.map((skill) => {
              return (
                <Text key={skill.slug}>
                  {skill.title} — теста пока нет, останется неподтверждённым
                </Text>
              );
            })}
          </>
        ) : (
          <Text>Сначала сохраните анкету.</Text>
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
