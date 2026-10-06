import type { ReactNode } from "react";

import { Stack, Text } from "@mantine/core";

export const SummaryItem = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={600}>
        {children}
      </Text>
    </Stack>
  );
};
