import { useState } from "react";

import {
  headerHeight,
  isLinkActive,
  shellLinks,
} from "@/app/shell/model/header";
import { ShellLink } from "@/app/shell/ui/ShellLink";
import { RequestOverlay } from "@/app/store/request-overlay";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ROUTES } from "@/shared/router/routes";
import { currentPath, returnTo } from "@/shared/router/use-return-path";
import {
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

// Высота пункта мобильного меню: в палец попадаешь с первого раза.
const touchHeight = 44;

export const AuthedShell = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpened, setMenuOpened] = useState(false);
  // Любой переход, в том числе «Назад», закрывает мобильное меню. Сбрасываем прямо в рендере,
  // а не в эффекте: так меню не мелькает открытым на новой странице.
  const [menuLocationKey, setMenuLocationKey] = useState(location.key);
  if (menuLocationKey !== location.key) {
    setMenuLocationKey(location.key);
    setMenuOpened(false);
  }
  const links = auth.user ? shellLinks[auth.user.role] : [];

  const logout = () => {
    void auth.logout({
      onSuccess: () => {
        navigate(ROUTES.AUTH.LOGIN, {
          state: returnTo(currentPath(location)),
        });
      },
    });
  };

  return (
    <AppShell
      header={{ height: headerHeight }}
      // Боковое меню только на телефоне: на широком экране ссылки живут в шапке.
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !menuOpened, desktop: true },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Text
              component={Link}
              to={ROUTES.HOME}
              fw={700}
              c="white"
              bg="fsp.6"
              px="sm"
              py={4}
              style={{ borderRadius: 6, flexShrink: 0 }}
            >
              ЛЦТ
            </Text>
            <Group gap="lg" wrap="nowrap" visibleFrom="sm">
              {links.map((link) => {
                return (
                  <ShellLink
                    key={link.to}
                    to={link.to}
                    label={link.label}
                    active={isLinkActive(link, location.pathname)}
                  />
                );
              })}
            </Group>
          </Group>
          <Button variant="default" visibleFrom="sm" onClick={logout}>
            Выйти
          </Button>
          <Burger
            hiddenFrom="sm"
            opened={menuOpened}
            onClick={() => {
              setMenuOpened(!menuOpened);
            }}
            aria-label={menuOpened ? "Закрыть меню" : "Открыть меню"}
          />
        </Group>
      </AppShell.Header>
      {/* Свёрнутое меню лишь сдвинуто за край экрана: inert убирает его из Tab,
          а на широком экране его нет совсем. */}
      <AppShell.Navbar p="md" hiddenFrom="sm" inert={!menuOpened}>
        <Stack gap={4}>
          {links.map((link) => {
            return (
              <NavLink
                key={link.to}
                component={Link}
                to={link.to}
                label={link.label}
                active={isLinkActive(link, location.pathname)}
                mih={touchHeight}
                // Ссылка на текущую страницу путь не меняет: закрываем меню явно.
                onClick={() => {
                  setMenuOpened(false);
                }}
              />
            );
          })}
          <Button variant="default" mt="md" h={touchHeight} onClick={logout}>
            Выйти
          </Button>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <RequestOverlay>
          <Outlet />
        </RequestOverlay>
      </AppShell.Main>
    </AppShell>
  );
});
