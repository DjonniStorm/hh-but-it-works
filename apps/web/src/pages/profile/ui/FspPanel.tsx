import { useEffect, useState } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { participantDetails } from "@/shared/fsp/model/participant";
import { FspHistory } from "@/shared/fsp/ui/FspHistory";
import { FspImportModal } from "@/shared/fsp/ui/FspImportModal";
import { Button, Group, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";

import type { CandidateProfile } from "@hh/contracts";

// Состояния поиска по почте: остальные ветки — тишина или текст под кнопкой.
type SearchState = "idle" | "searching" | "not-found" | "unavailable";

// Достижения ФСП под полем ID: история привязанного участника
// и поиск себя по почте, если ID ещё нет.
export const FspPanel = observer(
  ({ profile }: { profile: CandidateProfile }) => {
    const profiles = useStore(StoreKey.Profile);
    const [modalOpened, setModalOpened] = useState(false);
    const [search, setSearch] = useState<SearchState>("idle");
    const [historyReady, setHistoryReady] = useState(true);

    const fspId = profile.fspId;

    // История грузится, как только появился привязанный ID.
    useEffect(() => {
      if (!fspId) {
        return;
      }
      setHistoryReady(false);
      void profiles.loadFspHistory().finally(() => {
        setHistoryReady(true);
      });
    }, [profiles, fspId]);

    const participant =
      profiles.fspHistory?.participant?.fspId === fspId
        ? profiles.fspHistory.participant
        : null;

    const searchByEmail = () => {
      setSearch("searching");
      void profiles
        .loadFspPreview()
        .then((preview) => {
          if (preview?.status === "found") {
            setSearch("idle");
            setModalOpened(true);
            return;
          }
          setSearch(preview?.status ?? "unavailable");
        })
        .catch(() => {
          setSearch("unavailable");
        });
    };

    if (fspId) {
      return (
        <Stack gap={6} pt="sm">
          {!historyReady ? (
            <Text size="sm" c="dimmed">
              Загружаем историю из реестра…
            </Text>
          ) : participant ? (
            <>
              <FspHistory achievements={participant.achievements} />
              <Text size="sm" c="dimmed">
                {participantDetails(participant)}
              </Text>
              <Text size="xs" c="dimmed">
                Видно работодателям, пока включена видимость «Достижения ФСП».
              </Text>
            </>
          ) : (
            <Text size="sm" c="dimmed">
              Реестр не нашёл историю по этому ID или сейчас недоступен.
              Проверьте ID или попробуйте позже.
            </Text>
          )}
        </Stack>
      );
    }

    return (
      <Stack gap={6} pt="sm">
        <Text size="sm" fw={600}>
          Достижения ФСП
        </Text>
        <Text size="sm">
          ID участника ещё не привязан. Найдём вас в реестре по почте аккаунта —
          она уже подтверждена.
        </Text>
        <Group gap="xs" align="flex-start">
          <Button
            type="button"
            size="xs"
            variant="outline"
            loading={search === "searching"}
            onClick={searchByEmail}
          >
            Найти по моей почте
          </Button>
          {search === "not-found" ? (
            <Text size="sm" c="dimmed">
              В реестре нет участника с этой почтой — введите ID вручную.
            </Text>
          ) : null}
          {search === "unavailable" ? (
            <Text size="sm" c="dimmed">
              Реестр сейчас недоступен. Попробуйте позже.
            </Text>
          ) : null}
        </Group>
        <FspImportModal
          profile={profile}
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false);
          }}
        />
      </Stack>
    );
  },
);
