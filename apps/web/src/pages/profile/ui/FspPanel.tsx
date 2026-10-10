import { useEffect, useState } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { fspLoginUrl } from "@/shared/fsp/model/oidc";
import { FspHistory } from "@/shared/fsp/ui/FspHistory";
import { FspImportModal } from "@/shared/fsp/ui/FspImportModal";
import { sportRankLabel } from "@/shared/lib/labels";
import {
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
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
    // Привязка пишет в строку профиля: до первого сохранения анкеты писать некуда.
    const saved = profile.displayName.trim() !== "";

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
      void profiles.loadFspPreview({
        onSuccess: (preview) => {
          if (preview.status === "found") {
            setSearch("idle");
            setModalOpened(true);
            return;
          }
          setSearch(preview.status);
        },
        onError: () => {
          setSearch("unavailable");
        },
      });
    };

    if (fspId) {
      return (
        <Stack gap={10} pt="sm">
          {!historyReady ? (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Загружаем историю из реестра…
              </Text>
            </Group>
          ) : participant ? (
            <>
              <Group gap="xs" align="center">
                <Text size="sm" fw={600}>
                  {participant.name}
                </Text>
                {participant.sportRank ? (
                  <Badge color="fsp" variant="light" size="sm">
                    {sportRankLabel[participant.sportRank]}
                  </Badge>
                ) : null}
                {participant.rating !== null ? (
                  <Badge color="gray" variant="light" size="sm">
                    Рейтинг {participant.rating}
                  </Badge>
                ) : null}
              </Group>
              <FspHistory achievements={participant.achievements} />
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

    // Пустое состояние — отдельная зона: её видно, пока ID не привязан.
    return (
      <>
        <Paper withBorder radius="md" p="md" bg="gray.0">
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Достижения ФСП
            </Text>
            <Text size="sm">
              ID участника ещё не привязан. Подключите ФСП — так связь
              подтвердит сам реестр. Если реестр не знает вашей почты, найдём
              историю по почте аккаунта.
            </Text>
            <Group gap="xs" align="flex-start">
              {/* Disabled-кнопка не отдаёт события браузеру: тултип вешаем на обёртку. */}
              <Tooltip label="Сначала сохраните анкету" disabled={saved}>
                <span>
                  <Button
                    type="button"
                    size="xs"
                    disabled={!saved}
                    onClick={() => {
                      window.location.assign(fspLoginUrl());
                    }}
                  >
                    Подключить ФСП
                  </Button>
                </span>
              </Tooltip>
              <Tooltip label="Сначала сохраните анкету" disabled={saved}>
                <span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={!saved}
                    loading={search === "searching"}
                    onClick={searchByEmail}
                  >
                    Найти по моей почте
                  </Button>
                </span>
              </Tooltip>
            </Group>
            {!saved ? (
              <Text size="xs" c="dimmed">
                Подключение станет доступно после сохранения анкеты: заполните
                ФИО, специализацию и грейд и нажмите «Сохранить контакты».
              </Text>
            ) : null}
            {search === "not-found" ? (
              <Text size="sm" c="dimmed">
                В реестре нет участника с этой почтой.
              </Text>
            ) : null}
            {search === "unavailable" ? (
              <Text size="sm" c="dimmed">
                Реестр сейчас недоступен. Попробуйте позже.
              </Text>
            ) : null}
          </Stack>
        </Paper>
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
