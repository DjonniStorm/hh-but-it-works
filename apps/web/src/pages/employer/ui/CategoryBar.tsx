import { categoryMatchLabel } from "@/pages/employer/model/categories";
import { gradeLabel, specializationLabel } from "@/shared/lib/labels";
import { Button, Group, Stack, Text } from "@mantine/core";

import type { ShortlistCategory } from "@hh/contracts";
import type { Grade, Specialization } from "@hh/types";

type Props = {
  specialization: Specialization;
  categories: ShortlistCategory[];
  value: Grade[];
  onChange: (value: Grade[]) => void;
};

// Из каких категорий собрана подборка: грейды потребности и по ступени вокруг.
// Клик оставляет в выдаче только эту категорию, пустую выбрать нельзя.
export const CategoryBar = ({
  specialization,
  categories,
  value,
  onChange,
}: Props) => {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        Рекомендованные категории · {specializationLabel[specialization]}
      </Text>
      <Group gap="xs">
        {categories.map((category) => {
          const active = value.includes(category.grade);
          return (
            <Button
              key={category.grade}
              size="xs"
              variant={active ? "filled" : "default"}
              aria-pressed={active}
              disabled={category.candidateCount === 0}
              leftSection={active ? "✓" : null}
              onClick={() => {
                onChange(
                  active
                    ? value.filter((grade) => {
                        return grade !== category.grade;
                      })
                    : [...value, category.grade],
                );
              }}
            >
              {gradeLabel[category.grade]} ·{" "}
              {categoryMatchLabel[category.match]} · {category.candidateCount}
            </Button>
          );
        })}
      </Group>
    </Stack>
  );
};
