import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { Button, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";

export const HomePage = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();

  return (
    <Stack p="xl" gap="md">
      <Title order={1}>ЛЦТ</Title>
      <Text>{auth.user?.email}</Text>
      <Button
        variant="default"
        onClick={() => {
          void auth.logout({
            onSuccess: () => navigate(ROUTES.AUTH.LOGIN),
          });
        }}
      >
        Выйти
      </Button>
    </Stack>
  );
});
