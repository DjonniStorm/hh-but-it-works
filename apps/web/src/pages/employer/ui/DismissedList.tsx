import { useState } from "react";

import { specializationLabel } from "@/shared/lib/labels";
import { Button, Collapse, Group, Paper, Stack, Text } from "@mantine/core";

import type { Match } from "@hh/contracts";

export const DismissedList = ({
  matches,
  onRestore,
}: {
  matches: Match[];
  onRestore: (candidateId: string) => void;
}) => {
  const [opened, setOpened] = useState(false);

  if (matches.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Button
        variant="subtle"
        color="gray"
        size="compact-sm"
        onClick={() => {
          setOpened((value) => {
            return !value;
          });
        }}
        aria-expanded={opened}
        style={{ alignSelf: "flex-start" }}
      >
        {opened ? "Скрыть" : "Показать"} отклонённых ({matches.length})
      </Button>
      <Collapse expanded={opened}>
        <Stack gap="xs">
          {matches.map((match) => {
            return (
              <Paper key={match.candidate.id} withBorder p="sm" radius="md">
                <Group justify="space-between">
                  <Text size="sm">
                    {match.candidate.alias} ·{" "}
                    {specializationLabel[match.candidate.specialization]} ·
                    совпадение {match.matchScore}
                  </Text>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    onClick={() => {
                      onRestore(match.candidate.id);
                    }}
                  >
                    Вернуть
                  </Button>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </Collapse>
    </Stack>
  );
};
