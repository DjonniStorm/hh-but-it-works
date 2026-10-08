import { BreakdownGroup } from "@/pages/employer/ui/BreakdownGroup";
import { FspHistory } from "@/pages/employer/ui/FspHistory";
import { verificationLabel } from "@/shared/lib/labels";
import { verificationColor } from "@/shared/theme";
import { Badge, Divider, Group, SimpleGrid, Stack, Text } from "@mantine/core";

import type { Match } from "@hh/contracts";

// Разбор по группам признаков вместо одной цифры «AI 92%»: видно, откуда взялся балл.
export const WhyMatch = ({ match }: { match: Match }) => {
  return (
    <Stack gap="md">
      {/* Группы собирает Nest из компонентов ответа apps/ranking. */}
      {match.breakdown.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {match.breakdown.map((item) => {
              return <BreakdownGroup key={item.group} item={item} />;
            })}
          </SimpleGrid>
          <Divider />
        </>
      ) : null}

      <Stack gap={6}>
        <Text size="sm" fw={600}>
          Навыки и источник подтверждения
        </Text>
        <Group gap={6}>
          {match.candidate.skills.map((skill) => {
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

      <FspHistory achievements={match.candidate.fspAchievements} />
    </Stack>
  );
};
