import type { PropsWithChildren } from "react";

import { theme } from "@/shared/theme";
import { MantineProvider } from "@mantine/core";

export const Theme = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      {children}
    </MantineProvider>
  );
};
