# Публичная документация (VitePress)

Отдельный npm-проект. Не входит в pnpm-workspace корня. На Vercel: **Root Directory = `docs/prod`**. Сборка кладёт сайт в `site/.vitepress/dist`, это уже в `vercel.json` (`outputDirectory`). Framework можно оставить Other; папки `dist` в корне `docs/prod` нет.

```bash
cd docs/prod
npm install
npm run dev
```

Порт VitePress по умолчанию 5173. Если занят кабинетом, VitePress сам возьмёт следующий.

На сайте: как работает (`site/how/`), локальный запуск, стек, ФСП, антисписывание, код, дорожная карта, ссылки. Главная: `site/index.md`. Стенд только в подвале (`hire.eegov.net`).

## Писать статьи

Markdown в `site/`. Папки = разделы сайдбара. Порядок в меню — поле **`order`** в frontmatter (`---` сверху), не `index`. Без `order` страница уедет в конец. Картинки Excalidraw кладите **экспортом SVG** в `site/public/diagrams/` и вставляйте `![…](/diagrams/имя.svg)`. Исходники `.excalidraw` лежат в `site/excalidraw/` (в сайдбар не попадают). Mermaid: блок ` ```mermaid `.

Тема: Catppuccin Mocha (тёмная) / Latte (светлая), переключатель в шапке. Vue уже стоит — можно править `site/.vitepress/theme`.
