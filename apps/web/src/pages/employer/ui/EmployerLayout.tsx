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
    // Paper и поля берут фон из --mantine-color-body: в кабинете он белый, страница остаётся #EDEDED.
    <Box style={{ "--mantine-color-body": surfaceColor } as CSSProperties}>
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
