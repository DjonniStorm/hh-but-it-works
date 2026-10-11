import { Suspense, useEffect, useState } from "react";

import {
  headerHeight,
  isLinkActive,
  shellLinks,
} from "@/app/shell/model/header";
import { ShellLink } from "@/app/shell/ui/ShellLink";
import { RequestOverlay } from "@/app/store/request-overlay";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { waitingInvitations } from "@/pages/invitations/model/answer";
import { ArtBackdrop } from "@/shared/decor/ui/ArtBackdrop";
import { pollIntervalMs, usePolling } from "@/shared/lib/use-polling";
import { RouteFallback } from "@/shared/router/RouteFallback";
import { ROUTES } from "@/shared/router/routes";
import { currentPath, returnTo } from "@/shared/router/use-return-path";
import {
  AppShell,
  Badge,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
} from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { Role } from "@hh/types";

// Высота пункта мобильного меню: в палец попадаешь с первого раза.
const touchHeight = 44;

export const AuthedShell = observer(() => {
  const auth = useStore(StoreKey.Auth);
  const invitations = useStore(StoreKey.CandidateInvitations);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpened, setMenuOpened] = useState(false);
  const candidateId = auth.user?.role === Role.Candidate ? auth.user.id : null;

  // Счётчик в шапке. Просмотр здесь не отмечаем: иначе работодатель увидит его раньше списка.
  useEffect(() => {
    if (!candidateId) {
      return;
    }
    void invitations.load({ loader: false, markViewed: false }).catch(() => {
      return undefined;
    });
  }, [candidateId, invitations]);
  // Новые приглашения и счётчик подтягиваются сами, пока вкладка видна.
  usePolling(
    () => {
      void invitations.refresh();
    },
    pollIntervalMs,
    candidateId !== null,
  );
  // Любой переход, в том числе «Назад», закрывает мобильное меню. Сбрасываем прямо в рендере,
  // а не в эффекте: так меню не мелькает открытым на новой странице.
  const [menuLocationKey, setMenuLocationKey] = useState(location.key);
  if (menuLocationKey !== location.key) {
    setMenuLocationKey(location.key);
    setMenuOpened(false);
  }
  const links = auth.user ? shellLinks[auth.user.role] : [];
  const waiting = candidateId
    ? waitingInvitations(invitations.items).length
    : 0;

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
      {/* Фон приложения: статичный набор по хешу почты, под контентом и уведомлениями. */}
      <ArtBackdrop seed={auth.user?.email ?? "guest"} variant="app" />
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
                    count={
                      link.to === ROUTES.INVITATIONS && waiting > 0
                        ? waiting
                        : undefined
                    }
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
                rightSection={
                  link.to === ROUTES.INVITATIONS && waiting > 0 ? (
                    <Badge color="fsp" variant="filled" circle>
                      {waiting}
                    </Badge>
                  ) : null
                }
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
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </RequestOverlay>
      </AppShell.Main>
    </AppShell>
  );
});
