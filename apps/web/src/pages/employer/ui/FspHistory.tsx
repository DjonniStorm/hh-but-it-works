import { List, Stack, Text } from "@mantine/core";

import type { FspAchievement } from "@hh/contracts";

// История из реестра ФСП. Её нет — обычный случай, а не минус кандидату (ТЗ 2).
export const FspHistory = ({
  achievements,
}: {
  achievements: FspAchievement[];
}) => {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={600}>
        Достижения ФСП
      </Text>
      {achievements.length === 0 ? (
        <Text size="sm" c="dimmed">
          Истории ФСП нет — оценка по тесту и навыкам.
        </Text>
      ) : (
        <List size="sm" spacing={2}>
          {achievements.map((item) => {
            return (
              <List.Item key={`${item.title}-${item.year}`}>
                {item.title}, {item.year}
                {item.place ? ` — ${item.place} место` : " — участник"}
              </List.Item>
            );
          })}
        </List>
      )}
    </Stack>
  );
};
