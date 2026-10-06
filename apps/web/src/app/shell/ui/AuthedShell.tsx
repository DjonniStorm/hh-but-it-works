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

const candidateLinks = [
  { to: ROUTES.PROFILE, label: "Профиль" },
  { to: ROUTES.INVITATIONS, label: "Приглашения" },
];

const employerLinks = [
  { to: ROUTES.EMPLOYER.NEEDS, label: "Подборки" },
  { to: ROUTES.EMPLOYER.INVITATIONS, label: "Приглашения" },
  { to: ROUTES.EMPLOYER.COMPANY, label: "Компания" },
];

export const AuthedShell = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell header={{ height: headerHeight }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          {/* На узком экране ссылки прокручиваются по горизонтали, а не переносятся под шапку.
              Полосу прокрутки прячем: в шапке высотой 64px она съедает место под ссылками. */}
          <Group
            gap="lg"
            wrap="nowrap"
            style={{
              flex: 1,
              minWidth: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <Text
              fw={700}
              c="white"
              bg="fsp.6"
              px="sm"
              py={4}
              style={{ borderRadius: 6, flexShrink: 0 }}
            >
              ЛЦТ
            </Text>
            <ShellLink
              to={ROUTES.HOME}
              label="Главная"
              active={location.pathname === ROUTES.HOME}
            />
            {auth.user?.role === Role.Candidate
              ? candidateLinks.map((link) => {
                  return (
                    <ShellLink
                      key={link.to}
                      to={link.to}
                      label={link.label}
                      active={location.pathname === link.to}
                    />
                  );
                })
              : null}
            {auth.user?.role === Role.Employer
              ? employerLinks.map((link) => {
                  return (
                    <ShellLink
                      key={link.to}
                      to={link.to}
                      label={link.label}
                      active={location.pathname.startsWith(link.to)}
                    />
                  );
                })
              : null}
          </Group>
          <Button
            variant="default"
            style={{ flexShrink: 0 }}
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
