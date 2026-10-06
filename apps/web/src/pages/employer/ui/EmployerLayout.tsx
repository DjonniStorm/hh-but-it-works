import { type CSSProperties, useCallback, useEffect, useState } from "react";

import { useRootStore } from "@/app/store/store-context";
import { LoadError } from "@/pages/employer/ui/LoadError";
import { surfaceColor } from "@/shared/theme";
import { Box } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Outlet } from "react-router";

type LoadStatus = "loading" | "ready" | "failed";

// Шапка и лоадер приходят из AuthedShell. Здесь только данные кабинета и фон карточек.
export const EmployerLayout = observer(() => {
  const { employer, invitations } = useRootStore();
  // Статус загрузки кабинета живёт только здесь: сторы держат данные, лоадер — LoadingStore.
  // Ставится из then/catch, поэтому одно место и нет рассинхрона.
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = useCallback(() => {
    // Ошибка уже ушла тостом через ErrorStore, здесь только переключаем экран.
    Promise.all([employer.load(), invitations.load()])
      .then(() => {
        setStatus("ready");
      })
      .catch(() => {
        setStatus("failed");
      });
  }, [employer, invitations]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    // Paper берёт фон из --mantine-color-body, поля — из --mantine-color-white (в теме это #EDEDED).
    // В кабинете оба белые: карточки отделяются от страницы, а поля не выглядят неактивными.
    <Box
      style={
        {
          "--mantine-color-body": surfaceColor,
          "--mantine-color-white": surfaceColor,
        } as CSSProperties
      }
    >
      {status === "failed" ? (
        <LoadError
          title="Кабинет не загрузился"
          onRetry={() => {
            setStatus("loading");
            load();
          }}
        />
      ) : null}
      {status === "ready" ? <Outlet /> : null}
    </Box>
  );
});
