import { type CSSProperties, useEffect } from "react";

import { useRootStore } from "@/app/store/store-context";
import { surfaceColor } from "@/shared/theme";
import { Box } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Outlet } from "react-router";

// Шапка и лоадер приходят из AuthedShell. Здесь только данные кабинета и фон карточек.
export const EmployerLayout = observer(() => {
  const { employer, invitations } = useRootStore();

  useEffect(() => {
    void employer.load();
    void invitations.load();
  }, [employer, invitations]);

  return (
    // Paper и поля берут фон из --mantine-color-body: в кабинете он белый, страница остаётся #EDEDED.
    <Box style={{ "--mantine-color-body": surfaceColor } as CSSProperties}>
      {employer.loaded ? <Outlet /> : null}
    </Box>
  );
});
