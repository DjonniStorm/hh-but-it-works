import { TypeErrorArt } from "@/shared/error/ui/TypeErrorArt";
import { Anchor, Box, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { Link, useRouteError } from "react-router";

import { pageTitle } from "./page-title";
import { ROUTES } from "./routes";

// Картинка живёт прямо в модуле роутера: экран ошибки не ждёт отдельных чанков.
export const RouteError = () => {
  useHead({ title: pageTitle.error });
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "Страница не открылась";

  return (
    <Stack p="xl" maw={560} mx="auto" mt="xl" align="center" ta="center">
      <Box w={160} h={160}>
        <TypeErrorArt />
      </Box>
      <Title order={2}>Ошибка</Title>
      <Text>{message}</Text>
      <Anchor component={Link} to={ROUTES.HOME}>
        На главную
      </Anchor>
    </Stack>
  );
};
