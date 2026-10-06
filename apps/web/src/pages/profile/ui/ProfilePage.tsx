import { useEffect } from "react";

import { headerHeight } from "@/app/shell/model/header";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { profileTabParser } from "@/pages/profile/model/profile-tab";
import { BackHome } from "@/pages/profile/ui/BackHome";
import { ProfilePanels } from "@/pages/profile/ui/ProfilePanels";
import { TestingLobby } from "@/pages/profile/ui/TestingLobby";
import { Stack, Tabs, Text, Title } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useQueryState } from "nuqs";

import { Role } from "@hh/types";

export const ProfilePage = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const profiles = useStore(StoreKey.Profile);
  const loading = useStore(StoreKey.Loading);
  const [tab, setTab] = useQueryState(
    "tab",
    profileTabParser.withOptions({ history: "replace" }),
  );

  useEffect(() => {
    if (auth.user?.role !== Role.Candidate) {
      return;
    }
    void profiles.load();
  }, [auth.user?.role, profiles]);

  return (
    <Stack
      h={`calc(100dvh - ${headerHeight}px - 2rem)`}
      gap="md"
      style={{ minHeight: 0 }}
    >
      <BackHome />
      <Title order={2}>Профиль</Title>
      {profiles.profile ? (
        <Tabs
          value={tab}
          onChange={(value) => {
            if (value !== "form" && value !== "testing") {
              return;
            }
            void setTab(value);
          }}
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="form">Анкета</Tabs.Tab>
            <Tabs.Tab value="testing">Тестирование</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="form" style={{ flex: 1, minHeight: 0 }}>
            <ProfilePanels
              profile={profiles.profile}
              email={auth.user?.email ?? ""}
            />
          </Tabs.Panel>
          <Tabs.Panel value="testing" style={{ flex: 1, minHeight: 0 }}>
            <TestingLobby profile={profiles.profile} />
          </Tabs.Panel>
        </Tabs>
      ) : loading.visible ? null : (
        <Text>Профиль не загрузился</Text>
      )}
      <BackHome />
    </Stack>
  );
});
