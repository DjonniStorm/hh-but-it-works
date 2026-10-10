import { ROUTES } from "@/shared/router/routes";
import { surfaceColor, verificationColor } from "@/shared/theme";
import { Anchor, Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

import type { CandidateProfile } from "@hh/contracts";
import { SkillVerification } from "@hh/types";

import { isConfirmedSkill } from "../model/materials";
import { ownSkills } from "../model/own-skills";

// Чипсы навыков: подтверждённые в цвете верификации, счётчик сверху.
export const SkillsWidget = ({
  profile,
}: {
  profile: CandidateProfile | null;
}) => {
  const skills = ownSkills(profile);
  const confirmed = skills.filter(isConfirmedSkill).length;

  return (
    <Paper withBorder p="lg" radius="md" style={{ background: surfaceColor }}>
      <Stack gap="sm">
        <Group justify="space-between" gap="xs">
          <Title order={4}>Навыки</Title>
          <Text size="sm" c="dimmed">
            {confirmed} из {skills.length} подтверждено
          </Text>
        </Group>
        {skills.length > 0 ? (
          <Group gap="xs">
            {skills.slice(0, 12).map((skill) => {
              return (
                <Badge
                  key={skill.skillId}
                  color={
                    verificationColor[
                      skill.verification ?? SkillVerification.Unverified
                    ]
                  }
                  variant="light"
                >
                  {skill.title}
                </Badge>
              );
            })}
            {skills.length > 12 ? (
              <Badge variant="outline" color="gray">
                +{skills.length - 12}
              </Badge>
            ) : null}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            Навыки не добавлены — компании фильтруют именно по ним.
          </Text>
        )}
        <Anchor size="sm" component={Link} to={ROUTES.PROFILE}>
          Открыть анкету
        </Anchor>
      </Stack>
    </Paper>
  );
};
