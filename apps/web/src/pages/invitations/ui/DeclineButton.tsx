import { useState } from "react";

import { Button, Group, Popover, Stack, Text } from "@mantine/core";

// Отказ окончательный: переспрашиваем, чтобы случайный клик не закрыл предложение.
export const DeclineButton = ({ onConfirm }: { onConfirm: () => void }) => {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top-end"
      withArrow
      shadow="md"
    >
      <Popover.Target>
        <Button
          variant="default"
          onClick={() => {
            setOpened((value) => {
              return !value;
            });
          }}
        >
          Отклонить
        </Button>
      </Popover.Target>
      <Popover.Dropdown maw={280}>
        <Stack gap="sm">
          <Text size="sm">
            Отклонить приглашение? Ответ изменить нельзя, но компания сможет
            пригласить вас снова.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                setOpened(false);
              }}
            >
              Отмена
            </Button>
            <Button
              color="fspRed"
              size="xs"
              onClick={() => {
                setOpened(false);
                onConfirm();
              }}
            >
              Отклонить
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
