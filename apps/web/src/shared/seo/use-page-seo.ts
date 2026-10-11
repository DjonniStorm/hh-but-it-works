import { useHead } from "@unhead/react";

import { brandName, ogImageAlt, ogImagePath, titleTemplate } from "./brand";
import type { PageSeo } from "./types";

export const usePageSeo = (page: PageSeo) => {
  const origin = window.location.origin;
  const image = `${origin}${ogImagePath}`;
  const ogTitle = page.ogTitle ?? titleTemplate.replace("%s", page.title);
  const description = page.description;

  useHead({
    title: page.title,
    meta: [
      ...(description
        ? [
            { name: "description", content: description },
            { property: "og:description", content: description },
          ]
        : []),
      { property: "og:title", content: ogTitle },
      { property: "og:site_name", content: brandName },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: ogImageAlt },
      { name: "twitter:image", content: image },
    ],
  });
};
