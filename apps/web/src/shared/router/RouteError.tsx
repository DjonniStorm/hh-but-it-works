import { TypeErrorArt } from "@/shared/error/ui/TypeErrorArt";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import { Anchor, Box, Stack, Text, Title } from "@mantine/core";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import { ROUTES } from "./routes";

// Тексты экрана: адреса, которого нет в роутере, и прочего сбоя маршрута.
const screen = {
  notFound: {
    tab: pageSeo.notFound,
    title: "404: такой страницы нет",
    text: "Похоже, её сократили ещё на этапе первичного отбора. Проверьте адрес или вернитесь на главную.",
  },
  failed: {
    tab: pageSeo.error,
    title: "Ошибка",
    text: "Страница не загрузилась. Обновите её или вернитесь на главную.",
  },
};

// Картинка живёт прямо в модуле роутера: экран ошибки не ждёт отдельных чанков.
export const RouteError = () => {
  const error = useRouteError();
  // Неизвестный адрес react-router отдаёт ответом 404, а не исключением.
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const view = notFound ? screen.notFound : screen.failed;
  usePageSeo(view.tab);
  const message =
    !notFound && error instanceof Error ? error.message : view.text;

  return (
    <Stack p="xl" maw={560} mx="auto" mt="xl" align="center" ta="center">
      <Box w={160} h={160}>
        <TypeErrorArt />
      </Box>
      <Title order={2}>{view.title}</Title>
      <Text>{message}</Text>
      <Anchor component={Link} to={ROUTES.HOME}>
        На главную
      </Anchor>
    </Stack>
  );
};
