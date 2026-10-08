import { verificationLabel } from "@/shared/lib/labels";
import { verificationColor } from "@/shared/theme";
import { Badge, Group, Stack, Text } from "@mantine/core";

import type { CandidateSkill } from "@hh/contracts";

export const CandidateSkills = ({ skills }: { skills: CandidateSkill[] }) => {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={600}>
        Навыки и источник подтверждения
      </Text>
      <Group gap={6}>
        {skills.map((skill) => {
          return (
            <Badge
              key={skill.title}
              variant="light"
              color={verificationColor[skill.verification]}
              tt="none"
            >
              {skill.title} · {verificationLabel[skill.verification]}
              {skill.score === null ? "" : ` ${skill.score}`}
            </Badge>
          );
        })}
      </Group>
    </Stack>
  );
};
