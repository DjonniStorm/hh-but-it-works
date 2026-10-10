import {
  achievementKindLabel,
  achievementLevelLabel,
} from "@/shared/lib/labels";
import { List, Stack, Text } from "@mantine/core";

import type { FspAchievement } from "@hh/contracts";
import { FspAchievementKind } from "@hh/types";

// Строка истории: тип в начале (если это не обычные соревнования),
// уровень и организатор в конце — вкладка в карточке работодателя читается одним взглядом.
function achievementLine(item: FspAchievement): string {
  const kind =
    item.kind === FspAchievementKind.Competition
      ? ""
      : `${achievementKindLabel[item.kind]}: `;
  const place = item.place ? ` — ${item.place} место` : " — участник";
  const level = item.level ? ` · ${achievementLevelLabel[item.level]}` : "";
  const organizer = item.organizer ? ` · ${item.organizer}` : "";
  return `${kind}${item.title}, ${item.year}${place}${level}${organizer}`;
}

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
          {achievements.map((item, index) => {
            return (
              <List.Item key={`${item.title}-${item.year}-${index}`}>
                {achievementLine(item)}
              </List.Item>
            );
          })}
        </List>
      )}
    </Stack>
  );
};
