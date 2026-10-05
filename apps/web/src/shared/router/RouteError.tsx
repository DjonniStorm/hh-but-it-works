import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link, useRouteError } from "react-router";

import { ROUTES } from "./routes";

export const RouteError = () => {
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
