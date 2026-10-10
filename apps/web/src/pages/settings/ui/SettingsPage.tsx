import { useEffect } from "react";

import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { consentWhen } from "@/pages/legal/model/consent";
import { ConsentDocument } from "@/pages/legal/ui/ConsentDocument";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { Anchor, Paper, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

import { Role } from "@hh/types";

export const SettingsPage = observer(() => {
  useHead({ title: pageTitle.settings });
  const auth = useStore(StoreKey.Auth);

  useEffect(() => {
    void auth.me();
  }, [auth]);

  const when = consentWhen(auth.user?.consentAt);

  return (
    <Stack gap="lg" maw={720}>
      <Title order={2}>Настройки</Title>
      <Paper withBorder radius="md" p="xl">
        <Stack>
          <Text>
            {when
              ? `Согласие на обработку и публикацию данных профиля дано ${when}.`
              : "Согласие дано при регистрации. Дата подгружается."}
          </Text>
          <ConsentDocument />
        </Stack>
      </Paper>
      {auth.user?.role === Role.Candidate ? (
        <Text>
          Что видно работодателю и ID участника ФСП задаются в{" "}
          <Anchor component={Link} to={ROUTES.PROFILE}>
            профиле
          </Anchor>
          .
        </Text>
      ) : null}
    </Stack>
  );
});
