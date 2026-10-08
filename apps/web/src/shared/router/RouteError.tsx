import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { Link, useRouteError } from "react-router";

import { pageTitle } from "./page-title";
import { ROUTES } from "./routes";

export const RouteError = () => {
  useHead({ title: pageTitle.error });
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "Страница не открылась";

  return (
    <Stack p="xl">
      <Title order={2}>Ошибка</Title>
      <Text>{message}</Text>
      <Anchor component={Link} to={ROUTES.HOME}>
        На главную
      </Anchor>
    </Stack>
  );
};
