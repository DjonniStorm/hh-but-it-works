import { useEffect, useRef } from "react";

import { notifier } from "@/app/store/notifier";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { ArtBackdrop } from "@/shared/decor/ui/ArtBackdrop";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { useHead } from "@unhead/react";
import { observer } from "mobx-react-lite";
import { useNavigate, useSearchParams } from "react-router";

export const ConfirmPage = observer(() => {
  useHead({ title: pageTitle.confirm });
  const auth = useStore(StoreKey.Auth);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) {
      return;
    }
    started.current = true;
    void auth.confirm(
      { token },
      {
        onSuccess: () => {
          notifier.showSuccess("Почта подтверждена");
          navigate(ROUTES.AUTH.LOGIN);
        },
      },
    );
  }, [auth, navigate, token]);

  return (
    <Center mih="100vh" p="md">
      {/* Токен уникален на каждое письмо: фон подтверждения индивидуален, как и почта. */}
      <ArtBackdrop seed={token || "guest"} />
      <Paper withBorder p="xl" w={420}>
        <Stack>
          <Title order={2}>Подтверждение почты</Title>
          <Text>
            {token
              ? "Проверяем ссылку."
              : "Откройте ссылку из письма. Пока почта не подключена, ссылка пишется в лог API."}
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
});
