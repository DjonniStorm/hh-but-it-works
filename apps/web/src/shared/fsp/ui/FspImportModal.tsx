import { useEffect, useState } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { participantDetails } from "@/shared/fsp/model/participant";
import { FspHistory } from "@/shared/fsp/ui/FspHistory";
import { Button, Group, Modal, Stack, Switch, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateProfile } from "@hh/contracts";

type Props = {
  profile: CandidateProfile;
  opened: boolean;
  onClose: () => void;
};

// Подтверждение импорта: реестр нашёл участника по почте из аккаунта,
// кандидат сверяет имя и историю и решает, показывать ли её работодателям.
export const FspImportModal = observer(
  ({ profile, opened, onClose }: Props) => {
    const profiles = useStore(StoreKey.Profile);
    const participant = profiles.fspPreview?.participant ?? null;
    const [showFsp, setShowFsp] = useState(profile.showFsp);

    // При каждом открытии берём актуальную видимость: кандидат мог переключить её в анкете.
    useEffect(() => {
      if (opened) {
        setShowFsp(profile.showFsp);
      }
    }, [opened, profile.showFsp]);

    if (!participant) {
      return null;
    }

    return (
      <Modal opened={opened} onClose={onClose} title="Подтвердить привязку ФСП">
        <Stack>
          <Text size="sm">
            Реестр нашёл участника с почты вашего аккаунта. Проверьте, что это
            вы:
          </Text>
          <Text size="sm" fw={600}>
            {participantDetails(participant)}
          </Text>
          <FspHistory achievements={participant.achievements} />
          <Switch
            label="Показывать достижения ФСП работодателям"
            description="Позже переключается в видимости профиля."
            checked={showFsp}
            onChange={(event) => {
              setShowFsp(event.currentTarget.checked);
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                void profiles.linkFsp(
                  { fspId: participant.fspId, showFsp },
                  {
                    onSuccess: () => {
                      notifier.showSuccess("История ФСП привязана к анкете");
                      onClose();
                    },
                  },
                );
              }}
            >
              Привязать
            </Button>
          </Group>
        </Stack>
      </Modal>
    );
  },
);
