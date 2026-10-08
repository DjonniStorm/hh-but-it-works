import { skillSuggestions } from "@/pages/employer/model/options";
import {
  type SearchParams,
  searchSkillLimit,
} from "@/pages/employer/model/search-params";
import { gradeLabel, specializationOptions } from "@/shared/lib/labels";
import {
  Button,
  Checkbox,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
} from "@mantine/core";

import { type Specialization, gradeOrder } from "@hh/types";

type Props = {
  value: SearchParams;
  onChange: (patch: Partial<SearchParams>) => void;
  onReset: () => void;
};

// Пустой фильтр не ограничивает: без выбора — вся биржа.
export const SearchFilters = ({ value, onChange, onReset }: Props) => {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Специализация"
            placeholder="Любая"
            data={specializationOptions}
            clearable
            value={value.specialization}
            onChange={(next) => {
              onChange({ specialization: next as Specialization | null });
            }}
          />
          <TagsInput
            label="Стек"
            description="Нужны все навыки сразу. Enter — добавить свой."
            placeholder="Например, React"
            data={skillSuggestions}
            maxTags={searchSkillLimit}
            clearable
            value={value.skills}
            onChange={(skills) => {
              onChange({ skills });
            }}
          />
        </SimpleGrid>

        <Stack gap={6}>
          <Text size="sm" fw={500}>
            Подтверждённый грейд
          </Text>
          <Group gap="xs">
            {gradeOrder.map((grade) => {
              const active = value.grades.includes(grade);
              return (
                <Button
                  key={grade}
                  size="xs"
                  variant={active ? "filled" : "default"}
                  aria-pressed={active}
                  leftSection={active ? "✓" : null}
                  onClick={() => {
                    onChange({
                      grades: active
                        ? value.grades.filter((item) => {
                            return item !== grade;
                          })
                        : [...value.grades, grade],
                    });
                  }}
                >
                  {gradeLabel[grade]}
                </Button>
              );
            })}
          </Group>
        </Stack>

        <Group justify="space-between">
          <Checkbox
            label="Есть достижения ФСП"
            checked={value.fsp}
            onChange={(event) => {
              onChange({ fsp: event.currentTarget.checked });
            }}
          />
          <Button variant="subtle" size="compact-sm" onClick={onReset}>
            Сбросить фильтры
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};
