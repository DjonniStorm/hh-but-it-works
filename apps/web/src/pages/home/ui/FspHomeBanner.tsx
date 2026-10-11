import { useState } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { fspLoginUrl } from "@/shared/fsp/model/oidc";
import { FspImportModal } from "@/shared/fsp/ui/FspImportModal";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateProfile } from "@hh/contracts";

// Баннеры ФСП на главной: реестр нашёл историю по почте — предлагаем привязать;
// не нашли — напоминаем, что профиль ФСП не подключён. Реестр недоступен — молчим.
export const FspHomeBanner = observer(
  ({ profile }: { profile: CandidateProfile }) => {
    const profiles = useStore(StoreKey.Profile);
    const [dismissed, setDismissed] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);

    const preview = profiles.fspPreview;
    const participant =
      preview?.status === "found" ? preview.participant : null;
    // Привязка пишет в строку профиля: пока анкета не сохранена, показывать нечего —
    // баннеры появятся после первого сохранения контактов.
    const saved = profile.displayName.trim() !== "";

    if (profile.fspId || dismissed || !saved) {
      return null;
    }

    if (participant) {
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
    }

    if (preview?.status !== "not-found") {
      return null;
    }

    return (
      <Alert color="gray" title="Профиль ФСП не подключён">
        <Stack gap={8}>
          <Text size="sm">
            Реестр не нашёл участника с почтой вашего аккаунта. Подключите ФСП
            через вход на портале реестра — так работодатели увидят
            соревновательные достижения.
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              onClick={() => {
                window.location.assign(fspLoginUrl());
              }}
            >
              Подключить ФСП
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
