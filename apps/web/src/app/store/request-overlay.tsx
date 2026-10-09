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
          // При пустой странице (профиль ещё грузится) контента нет, оверлей схлопывался
          // в полоску под шапкой и лоадер резался. Рисуем область на весь видимый
          // экран под шапкой AppShell — её отступы лежат в CSS-переменных шелла.
          minHeight: fullScreen
            ? "100dvh"
            : "calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-padding, 0rem) * 2)",
        }}
      >
        <LoadingOverlay
          visible={loading.visible}
          zIndex={400}
          loaderProps={{ size: 148, children: <RequestLoader /> }}
        />
        {children}
      </div>
    );
  },
);
