import { BreakdownGroup } from "@/pages/employer/ui/BreakdownGroup";
import { CandidateSkills } from "@/pages/employer/ui/CandidateSkills";
import { FspHistory } from "@/pages/employer/ui/FspHistory";
import { Divider, SimpleGrid, Stack } from "@mantine/core";

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

      <CandidateSkills skills={match.candidate.skills} />

      <FspHistory achievements={match.candidate.fspAchievements} />
    </Stack>
  );
};
