import { type CSSProperties, useCallback, useEffect, useState } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { canAnswer } from "@/pages/invitations/model/answer";
import { CandidateInvitationCard } from "@/pages/invitations/ui/CandidateInvitationCard";
import { ErrorScreen } from "@/shared/error/ui/ErrorScreen";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { surfaceColor } from "@/shared/theme";
import { Anchor, Box, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

type LoadStatus = "loading" | "ready" | "failed";

export const CandidateInvitationsPage = observer(() => {
  useHead({ title: pageTitle.candidateInvitations });
  const invitations = useStore(StoreKey.CandidateInvitations);
  // Статус загрузки экрана держим здесь, как в EmployerLayout: стор хранит только данные.
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = useCallback(() => {
    // Ошибка уже ушла тостом через ErrorStore, здесь только переключаем экран.
    invitations
      .load()
      .then(() => {
        setStatus("ready");
      })
      .catch(() => {
        setStatus("failed");
      });
  }, [invitations]);

  useEffect(() => {
    load();
  }, [load]);

  const waiting = invitations.items.filter((item) => {
    return canAnswer(item.status);
  }).length;

  return (
    // Карточки белые на сером фоне, как в кабинете работодателя.
    <Box
      style={
        {
          "--mantine-color-body": surfaceColor,
          "--mantine-color-white": surfaceColor,
        } as CSSProperties
      }
    >
      {status === "failed" ? (
        <ErrorScreen
          title="Приглашения не загрузились"
          onReload={() => {
            setStatus("loading");
            load();
          }}
        />
      ) : null}
      {status === "ready" ? (
        <Stack gap="lg" maw={800} mx="auto">
          <Stack gap={4}>
            <Title order={2}>Приглашения</Title>
            <Text c="dimmed" size="sm">
              {waiting > 0
                ? `Ждут вашего ответа: ${waiting}. `
                : "Новых приглашений нет. "}
              Принимая приглашение, вы открываете компании свой контакт:
              Telegram или почту.
            </Text>
          </Stack>

          {invitations.items.length === 0 ? (
            <Stack gap="sm">
              <Text>Приглашений пока нет.</Text>
              <Anchor component={Link} to={ROUTES.PROFILE}>
                К профилю
              </Anchor>
            </Stack>
          ) : (
            invitations.items.map((invitation) => {
              return (
                <CandidateInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                />
              );
            })
          )}
        </Stack>
      ) : null}
    </Box>
  );
});
