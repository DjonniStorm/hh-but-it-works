import type { PropsWithChildren } from "react";

import { LoadingOverlay } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { useStore } from "./store-context";
import { StoreKey } from "./store-key";

export const RequestOverlay = observer(({ children }: PropsWithChildren) => {
  const loading = useStore(StoreKey.Loading);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <LoadingOverlay visible={loading.visible} zIndex={400} />
      {children}
    </div>
  );
});
