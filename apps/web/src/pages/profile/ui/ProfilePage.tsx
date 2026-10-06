import { useEffect } from "react";

import { headerHeight } from "@/app/shell/model/header";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { BackHome } from "@/pages/profile/ui/BackHome";
import { ContactsPanel } from "@/pages/profile/ui/ContactsPanel";
import { SkillsPanel } from "@/pages/profile/ui/SkillsPanel";
import { ScrollArea, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { Role } from "@hh/types";

export const ProfilePage = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const profiles = useStore(StoreKey.Profile);
  const loading = useStore(StoreKey.Loading);

  useEffect(() => {
    if (auth.user?.role !== Role.Candidate) {
      return;
    }
    void profiles.load();
  }, [auth.user?.role, profiles]);

  return (
    <ScrollArea
      h={`calc(100dvh - ${headerHeight}px - 2rem)`}
      w="100%"
      offsetScrollbars
      type="auto"
    >
      <Stack gap="md">
        <BackHome />
        <Title order={2}>Профиль</Title>
        {profiles.profile ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <ContactsPanel
              profile={profiles.profile}
              email={auth.user?.email ?? ""}
            />
            <SkillsPanel profile={profiles.profile} />
          </SimpleGrid>
        ) : loading.visible ? null : (
          <Text>Профиль не загрузился</Text>
        )}
        <BackHome />
      </Stack>
    </ScrollArea>
  );
});
