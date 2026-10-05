import type { PropsWithChildren } from "react";

import { theme } from "@/shared/theme";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const Theme = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
};
