import {
  type Refinement,
  refinementKeys,
  refinementLabel,
} from "@/pages/employer/model/refinements";
import { Chip, Group, Text } from "@mantine/core";

export const RefinementBar = ({
  value,
  onChange,
  shown,
  total,
}: {
  value: Refinement[];
  onChange: (value: Refinement[]) => void;
  shown: number;
  total: number;
}) => {
  return (
    <Group justify="space-between" align="center">
      <Chip.Group
        multiple
        value={value}
        onChange={(next) => {
          onChange(next as Refinement[]);
        }}
      >
        <Group gap="xs">
          {refinementKeys.map((key) => {
            return (
              <Chip key={key} value={key} size="sm">
                {refinementLabel[key]}
              </Chip>
            );
          })}
        </Group>
      </Chip.Group>
      <Text size="sm" c="dimmed">
        Показано {shown} из {total}
      </Text>
    </Group>
  );
};
