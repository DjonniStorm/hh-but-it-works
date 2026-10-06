import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";

export const HomePage = observer(() => {
  const auth = useStore(StoreKey.Auth);

  return (
    <Stack gap="md">
      <Title order={1}>ЛЦТ</Title>
      <Text>{auth.user?.email}</Text>
    </Stack>
  );
});
