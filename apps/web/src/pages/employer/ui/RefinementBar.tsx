import {
  type Refinement,
  refinementKeys,
  refinementLabel,
} from "@/pages/employer/model/refinements";
import { Button, Group, Text } from "@mantine/core";

// Переключатели в стиле остальных кнопок кабинета: выключенный — как «Отмена», включённый — основной цвет.
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
      <Group gap="xs">
        {refinementKeys.map((key) => {
          const active = value.includes(key);
          return (
            <Button
              key={key}
              size="xs"
              variant={active ? "filled" : "default"}
              aria-pressed={active}
              leftSection={active ? "✓" : null}
              onClick={() => {
                onChange(
                  active
                    ? value.filter((item) => {
                        return item !== key;
                      })
                    : [...value, key],
                );
              }}
            >
              {refinementLabel[key]}
            </Button>
          );
        })}
      </Group>
      <Text size="sm" c="dimmed">
        Показано {shown} из {total}
      </Text>
    </Group>
  );
};
