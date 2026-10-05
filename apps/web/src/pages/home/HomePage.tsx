import { ROUTES } from "@/shared/router/routes";
import { Anchor, Stack, Title } from "@mantine/core";
import { Link } from "react-router";

export const HomePage = () => {
  return (
    <Stack p="xl" gap="md">
      <Title order={1}>ЛЦТ</Title>
      <Anchor component={Link} to={ROUTES.TEST}>
        Тестовая страница темы
      </Anchor>
    </Stack>
  );
};
