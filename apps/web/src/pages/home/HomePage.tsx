import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { pageTitle, usePageTitle } from "@/shared/router/use-page-title";
import { Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Navigate } from "react-router";

import { Role } from "@hh/types";

export const HomePage = observer(() => {
  usePageTitle(pageTitle.home);
  const auth = useStore(StoreKey.Auth);

  // У работодателя своя главная: подборки.
  if (auth.user?.role === Role.Employer) {
    return <Navigate to={ROUTES.EMPLOYER.ROOT} replace />;
  }

  return (
    <Stack gap="md">
      <Title order={1}>ЛЦТ</Title>
      <Text>{auth.user?.email}</Text>
    </Stack>
  );
});
