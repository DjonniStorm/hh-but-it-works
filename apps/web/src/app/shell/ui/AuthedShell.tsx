import { headerHeight } from "@/app/shell/model/header";
import { ShellLink } from "@/app/shell/ui/ShellLink";
import { RequestOverlay } from "@/app/store/request-overlay";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { currentPath, returnTo } from "@/shared/router/use-return-path";
import { AppShell, Button, Group, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Outlet, useLocation, useNavigate } from "react-router";

import { Role } from "@hh/types";

export const AuthedShell = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell header={{ height: headerHeight }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="lg">
            <Text
              fw={700}
              c="white"
              bg="fsp.6"
              px="sm"
              py={4}
              style={{ borderRadius: 6 }}
            >
              ЛЦТ
            </Text>
            <ShellLink
              to={ROUTES.HOME}
              label="Главная"
              active={location.pathname === ROUTES.HOME}
            />
            {auth.user?.role === Role.Candidate ? (
              <ShellLink
                to={ROUTES.PROFILE}
                label="Профиль"
                active={location.pathname === ROUTES.PROFILE}
              />
            ) : null}
          </Group>
          <Button
            variant="default"
            onClick={() => {
              void auth.logout({
                onSuccess: () => {
                  navigate(ROUTES.AUTH.LOGIN, {
                    state: returnTo(currentPath(location)),
                  });
                },
              });
            }}
          >
            Выйти
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <RequestOverlay>
          <Outlet />
        </RequestOverlay>
      </AppShell.Main>
    </AppShell>
  );
});
