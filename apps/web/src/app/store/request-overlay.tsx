import type { PropsWithChildren } from "react";

import { RequestLoader } from "@/shared/loader/ui/RequestLoader";
import { LoadingOverlay } from "@mantine/core";
import { observer } from "mobx-react-lite";

import { useStore } from "./store-context";
import { StoreKey } from "./store-key";

export const RequestOverlay = observer(
  ({
    children,
    fullScreen = false,
  }: PropsWithChildren<{ fullScreen?: boolean }>) => {
    const loading = useStore(StoreKey.Loading);

    return (
      <div
        style={{
          position: "relative",
          minHeight: fullScreen ? "100vh" : "100%",
          height: fullScreen ? undefined : "100%",
        }}
      >
        {/* Оверлей на весь экран: внутри короткой страницы картинка обрезалась снизу,
            на длинной уезжала из вида. */}
        <LoadingOverlay
          pos="fixed"
          visible={loading.visible}
          zIndex={400}
          loaderProps={{ size: 148, children: <RequestLoader /> }}
        />
        {children}
      </div>
    );
  },
);
