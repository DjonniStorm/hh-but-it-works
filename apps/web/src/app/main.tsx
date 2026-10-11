import { StrictMode } from "react";

import { rootStore } from "@/app/store/root-store";
import { StoreProvider } from "@/app/store/store-context";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import { createRoot } from "react-dom/client";

import { HeadProvider, Router, Theme } from "./providers";

// Сессию восстанавливаем сразу, на любой странице. Кабинет ждёт этого в
// загрузчике роута, а вход и регистрация не ждут: по готовности они сами
// уведут вошедшего в кабинет.
void rootStore.auth.restoreSession();

const element = document.getElementById("root");
if (!element) {
  throw new Error("Root element not found");
}

const root = createRoot(element, {
  onCaughtError: (error) => {
    console.error("Caught error:", error);
  },
  onUncaughtError: (error) => {
    console.error("Uncaught error:", error);
  },
  onRecoverableError: (error) => {
    console.error("Recoverable error:", error);
  },
});

root.render(
  <StrictMode>
    <StoreProvider>
      <HeadProvider>
        <Theme>
          <Router />
        </Theme>
      </HeadProvider>
    </StoreProvider>
  </StrictMode>,
);
