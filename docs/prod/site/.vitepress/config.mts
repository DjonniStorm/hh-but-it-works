import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { generateSidebar } from "vitepress-sidebar";

const here = dirname(fileURLToPath(import.meta.url));

const github = "https://github.com/DjonniStorm/hh-but-it-works";

export default withMermaid(
  defineConfig({
    title: "ЛЦТ",
    description:
      "Маркетплейс работы с проверенными IT-кандидатами: тесты, подборка, приглашения.",
    lang: "ru",
    appearance: "dark",
    // mermaid тянет UMD fastdom; без prebundle Vite отдаёт его как ESM без default
    vite: {
      resolve: {
        alias: [
          {
            find: /^fastdom$/,
            replacement: resolve(here, "shims/fastdom.js"),
          },
        ],
      },
      optimizeDeps: {
        include: ["mermaid", "fastdom", "cytoscape-fcose", "@panzoom/panzoom"],
      },
    },
    markdown: {
      theme: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
    },
    themeConfig: {
      nav: [
        { text: "Как работает", link: "/how/" },
        { text: "Репозиторий", link: github },
      ],
      socialLinks: [{ icon: "github", link: github }],
      sidebar: generateSidebar({
        documentRootPath: "site",
        collapsed: false,
        hyphenToSpace: true,
        capitalizeEachWords: true,
        useTitleFromFileHeading: true,
        useFolderTitleFromIndexFile: true,
        useFolderLinkFromIndexFile: true,
        sortMenusByFrontmatterOrder: true,
        frontmatterOrderDefaultValue: 100,
        excludePattern: ["excalidraw"],
      }),
      footer: {
        message: `<a href="${github}">GitHub</a>`,
      },
      search: { provider: "local" },
      outline: { label: "На странице" },
      darkModeSwitchLabel: "Тема",
      lightModeSwitchTitle: "Latte",
      darkModeSwitchTitle: "Mocha",
    },
  }),
);
