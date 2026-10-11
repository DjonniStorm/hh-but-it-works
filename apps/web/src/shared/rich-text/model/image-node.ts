import { Node, mergeAttributes } from "@tiptap/core";

import { isHttpUrl } from "@hh/contracts";

// Картинка по внешней ссылке: свои файлы мы не храним, поэтому в документ
// попадает только http(s)-URL. При вставке из чужой разметки (paste) фильтруем
// сразу — data:-картинка не дойдёт даже до серверной проверки.
export const ImageNode = Node.create({
  name: "image",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }
          const src = element.getAttribute("src");
          if (!src || !isHttpUrl(src)) {
            return false;
          }
          return { src, alt: element.getAttribute("alt") || null };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { loading: "lazy" })];
  },
});
