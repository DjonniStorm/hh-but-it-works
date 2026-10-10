import { useEffect, useRef, useState } from "react";

import { notifier } from "@/app/store/notifier";
import { RequestFailed } from "@/app/store/request";
import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { fspCallbackCode } from "@/shared/fsp/model/oidc";
import { ROUTES } from "@/shared/router/routes";
import { Alert, Button, Center, Loader, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router";

// Колбэк OIDC-входа: ловим code от реестра ФСП, обмениваем его на сервере
// и возвращаем кандидата в анкету с привязанным ID.
export const FspCallbackPage = observer(() => {
  const profiles = useStore(StoreKey.Profile);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // Один код на один заход: эффект не должен повториться от перевыборки стора.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    const result = fspCallbackCode(window.location.search);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    void profiles.fspLogin(result.code, {
      onSuccess: () => {
        notifier.showSuccess("История ФСП привязана к анкете");
        navigate(ROUTES.PROFILE, { replace: true });
      },
      // Причина важна: «сохраните анкету» и «код не подошёл» — разные следующие шаги.
      onError: (error) => {
        setError(
          error instanceof RequestFailed
            ? error.message
            : "Реестр не смог обменять код. Начните вход заново.",
        );
      },
    });
  }, [profiles, navigate]);

  if (error) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="md">
          <Alert color="fspRed" title="Не получилось завершить вход">
            <Text size="sm">{error}</Text>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              navigate(ROUTES.PROFILE, { replace: true });
            }}
          >
            Вернуться в анкету
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm">
        <Loader />
        <Text size="sm" c="dimmed">
          Подтверждаем вход через реестр ФСП…
        </Text>
      </Stack>
    </Center>
  );
});
