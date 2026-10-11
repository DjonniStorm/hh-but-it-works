# Публичная документация (VitePress)

Отдельный npm-проект. Не входит в pnpm-workspace корня. На Vercel: **Root Directory = `docs/prod`**, Framework VitePress, `npm install` / `npm run build`.

```bash
cd docs/prod
npm install
npm run dev
```

Порт VitePress по умолчанию 5173. Если занят кабинетом — VitePress сам возьмёт следующий.

## Писать статьи

Markdown в `site/`. Папки = разделы сайдбара. Картинки Excalidraw кладите **экспортом SVG** в `site/public/diagrams/` и вставляйте `![…](/diagrams/имя.svg)`. Исходники `.excalidraw` — в `site/excalidraw/` (в сайдбар не попадают). Mermaid — в markdown-блоке ` ```mermaid `.

Тема: Catppuccin Mocha (тёмная) / Latte (светлая), переключатель в шапке. Vue уже стоит — можно править `site/.vitepress/theme`.
