import { skillLevelOptions } from "@/pages/profile/model/options";
import type { SkillRow } from "@/pages/profile/model/types";
import { SkillStatusBadge } from "@/pages/profile/ui/SkillStatusBadge";
import { Button, Group, Paper, Select, Text } from "@mantine/core";
import type { GetInputPropsReturnType } from "@mantine/form";

export const AssessedSkill = ({
  skill,
  levelProps,
  onRemove,
}: {
  skill: SkillRow;
  levelProps: GetInputPropsReturnType;
  onRemove: () => void;
}) => {
  return (
    <Paper shadow="xs" withBorder p="sm" radius="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{skill.title}</Text>
        <SkillStatusBadge
          level={skill.level}
          verification={skill.verification}
        />
      </Group>
      <Group align="flex-end" wrap="nowrap">
        <Select
          style={{ flex: 1 }}
          aria-label={`Уровень ${skill.title}`}
          data={skillLevelOptions}
          {...levelProps}
        />
        <Button type="button" variant="default" onClick={onRemove}>
          Убрать
        </Button>
      </Group>
    </Paper>
  );
};
