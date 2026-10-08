import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { feedbackColor } from "@/shared/theme";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { HiringNeed } from "@hh/contracts";

type Props = {
  need: HiringNeed;
  opened: boolean;
  onClose: () => void;
};

// После удаления потребности в сторе нет, и NeedPage сам уводит на список.
export const DeleteNeedModal = observer(({ need, opened, onClose }: Props) => {
  const employer = useStore(StoreKey.Employer);

  return (
    <Modal opened={opened} onClose={onClose} title="Удалить потребность?">
      <Stack>
        <Text size="sm">
          «{need.title}» и её подборка пропадут из кабинета. Отправленные по ней
          приглашения останутся: кандидаты смогут на них ответить.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button
            color={feedbackColor.error}
            onClick={() => {
              void employer.deleteNeed(need.id, {
                onSuccess: () => {
                  notifier.showSuccess("Потребность удалена");
                },
              });
            }}
          >
            Удалить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
});
