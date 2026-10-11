import "@catppuccin/vitepress/theme/mocha/mauve.css";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import "./mermaid-zoom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (import.meta.env.SSR) {
      return;
    }
    const boot = (): void => {
      void import("./mermaid-zoom").then(({ setupMermaidZoom }) => {
        setupMermaidZoom();
      });
    };
    boot();
    router.onAfterRouteChange = () => {
      window.setTimeout(boot, 80);
    };
  },
} satisfies Theme;
