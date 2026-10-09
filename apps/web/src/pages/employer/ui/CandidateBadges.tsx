import { gradeLabel, specializationLabel } from "@/shared/lib/labels";
import { gradeBadge } from "@/shared/theme";
import { Badge, Group, Text } from "@mantine/core";

import type { CandidateSnapshot } from "@hh/contracts";

// Специализация и грейд кандидата: в подборке и в поиске одинаково.
export const CandidateBadges = ({
  candidate,
}: {
  candidate: CandidateSnapshot;
}) => {
  const verified = candidate.verifiedGrade;
  const grade = verified ?? candidate.claimedGrade;
  const gradeStyle = verified ? gradeBadge.verified : gradeBadge.unverified;

  return (
    <Group gap={6}>
      <Badge variant="outline" color="dark" tt="none">
        {specializationLabel[candidate.specialization]}
      </Badge>
      <Badge variant={gradeStyle.variant} color={gradeStyle.color} tt="none">
        {gradeLabel[grade]} · {verified ? "подтверждён" : "не подтверждён"}
      </Badge>
      {verified && verified !== candidate.claimedGrade ? (
        <Text size="xs" c="dimmed">
          заявлял {gradeLabel[candidate.claimedGrade]}
        </Text>
      ) : null}
    </Group>
  );
};
