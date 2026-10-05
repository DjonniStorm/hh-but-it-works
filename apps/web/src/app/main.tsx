import { StrictMode } from "react";

import { RequestOverlay } from "@/app/store/request-overlay";
import { StoreProvider } from "@/app/store/store-context";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createRoot } from "react-dom/client";

import { Router, Theme } from "./providers";

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
      <Theme>
        <RequestOverlay>
          <Router />
        </RequestOverlay>
      </Theme>
    </StoreProvider>
  </StrictMode>,
);
