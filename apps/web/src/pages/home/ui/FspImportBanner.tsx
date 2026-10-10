import { useState } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { FspImportModal } from "@/shared/fsp/ui/FspImportModal";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateProfile } from "@hh/contracts";

// Баннер импорта ФСП: реестр уже ответил «нашли» — остаётся показать историю
// и спросить согласия. Статусы not-found и unavailable кандидата не беспокоят.
export const FspImportBanner = observer(
  ({ profile }: { profile: CandidateProfile }) => {
    const profiles = useStore(StoreKey.Profile);
    const [dismissed, setDismissed] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);

    const preview = profiles.fspPreview;
    const participant =
      preview?.status === "found" ? preview.participant : null;

    if (!participant || profile.fspId || dismissed) {
      return null;
    }

    return (
      <>
        <Alert color="fsp" title="Нашли вашу историю в реестре ФСП">
          <Stack gap={8}>
            <Text size="sm">
              {participant.name} — {participant.achievements.length}{" "}
              {achievementsWord(participant.achievements.length)}. Привяжите
              историю к анкете, чтобы работодатели её видели.
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                onClick={() => {
                  setModalOpened(true);
                }}
              >
                Посмотреть и привязать
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setDismissed(true);
                }}
              >
                Не сейчас
              </Button>
            </Group>
          </Stack>
        </Alert>
        <FspImportModal
          profile={profile}
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false);
          }}
        />
      </>
    );
  },
);

// Склонение «1 достижение, 2 достижения, 5 достижений».
function achievementsWord(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) {
    return "достижений";
  }
  if (mod10 === 1) {
    return "достижение";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "достижения";
  }
  return "достижений";
}
