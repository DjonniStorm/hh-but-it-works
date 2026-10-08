import { formatGradeRange } from "@/pages/employer/model/grade-range";
import { formatDate } from "@/shared/lib/format";
import { specializationLabel, workFormatLabel } from "@/shared/lib/labels";
import { needPath } from "@/shared/router/routes";
import {
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Link } from "react-router";

import { type HiringNeed, formatSalary } from "@hh/contracts";

export const NeedCard = ({ need }: { need: HiringNeed }) => {
  return (
    <UnstyledButton component={Link} to={needPath(need.id)}>
      <Paper withBorder radius="md" p="lg" h="100%">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2}>
              <Text fw={700} size="lg">
                {need.title}
              </Text>
              <Text size="sm" c="dimmed">
                {specializationLabel[need.specialization]} ·{" "}
                {formatGradeRange(need.gradeFrom, need.gradeTo)} ·{" "}
                {workFormatLabel[need.workFormat]}
              </Text>
            </Stack>
            <Stack gap={0} align="flex-end">
              <Text fw={700} size="xl" c="fsp.6">
                {need.candidateCount}
              </Text>
              <Text size="xs" c="dimmed">
                в подборке
              </Text>
            </Stack>
          </Group>
          <Group gap={6}>
            {need.mustSkills.map((skill) => {
              return (
                <Badge key={skill} variant="light" tt="none">
                  {skill}
                </Badge>
              );
            })}
          </Group>
          <Group justify="space-between">
            <Text size="sm">
              {formatSalary(need.salaryFrom, need.salaryTo)}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(need.createdAt)}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
};
