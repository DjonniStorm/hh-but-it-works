import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { HomeIdentity } from "@/pages/home/ui/HomeIdentity";
import { HomeOffer } from "@/pages/home/ui/HomeOffer";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { Stack } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { Navigate } from "react-router";

import { Role } from "@hh/types";

export const HomePage = observer(() => {
  useHead({ title: pageTitle.home });
  const auth = useStore(StoreKey.Auth);

  // У работодателя своя главная: подборки.
  if (auth.user?.role === Role.Employer) {
    return <Navigate to={ROUTES.EMPLOYER.ROOT} replace />;
  }

  return (
    <Stack maw={640} gap="xl">
      <HomeOffer />
      <HomeIdentity />
    </Stack>
  );
});
