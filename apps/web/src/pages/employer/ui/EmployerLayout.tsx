import { type CSSProperties, useEffect } from "react";

import { useRootStore } from "@/app/store/store-context";
import { LoadError } from "@/pages/employer/ui/LoadError";
import { surfaceColor } from "@/shared/theme";
import { Box } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Outlet } from "react-router";

// Шапка и лоадер приходят из AuthedShell. Здесь только данные кабинета и фон карточек.
export const EmployerLayout = observer(() => {
  const { employer, invitations } = useRootStore();

  useEffect(() => {
    employer.ensureLoaded();
    invitations.ensureLoaded();
  }, [employer, invitations]);

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
      {employer.loadFailed ? (
        <LoadError
          title="Кабинет не загрузился"
          onRetry={() => {
            void employer.load();
          }}
        />
      ) : null}
      {employer.loaded ? <Outlet /> : null}
    </Box>
  );
});
