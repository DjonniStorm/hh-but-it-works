import { z } from "zod";

// Документ ричтекста — JSON ProseMirror (формат Tiptap). Схема пускает только
// узлы из белого списка: script в документ физически не помещается, рендер на
// вебе рисует лишь известные узлы — XSS закрыт с двух сторон.
const maxRichTextBytes = 50_000;
const maxRichTextChars = 10_000;
const maxBlocks = 100;
const maxInlinesPerBlock = 200;
const maxListItems = 50;

// Ссылка — только http и https: иначе пройдёт javascript:.
const richTextLinkSchema = z.object({
  type: z.literal("link"),
  attrs: z.object({
    href: z.url({
      protocol: /^https?$/,
      error: "Ссылка целиком, с http:// или https://",
    }),
  }),
});

const richTextMarkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  richTextLinkSchema,
]);

const richTextNodeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().max(maxRichTextChars),
    marks: z.array(richTextMarkSchema).max(5).optional(),
  }),
  z.object({ type: z.literal("hardBreak") }),
]);

const richTextParagraphSchema = z.object({
  type: z.literal("paragraph"),
  content: z.array(richTextNodeSchema).max(maxInlinesPerBlock).optional(),
});

// Заголовок один — второй уровень: для описания компании хватает.
const richTextHeadingSchema = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.literal(2) }),
  content: z.array(richTextNodeSchema).max(maxInlinesPerBlock).optional(),
});

// Редактор не даёт вкладывать списки (listItem: nested: false), поэтому
// элемент списка — только абзацы.
const richTextListItemSchema = z.object({
  type: z.literal("listItem"),
  content: z.array(richTextParagraphSchema).min(1).max(20),
});

const richTextBulletListSchema = z.object({
  type: z.literal("bulletList"),
  content: z.array(richTextListItemSchema).min(1).max(maxListItems),
});

const richTextOrderedListSchema = z.object({
  type: z.literal("orderedList"),
  content: z.array(richTextListItemSchema).min(1).max(maxListItems),
});

const richTextBlockSchema = z.discriminatedUnion("type", [
  richTextParagraphSchema,
  richTextHeadingSchema,
  richTextBulletListSchema,
  richTextOrderedListSchema,
]);

export const richTextSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(richTextBlockSchema).min(1).max(maxBlocks),
  })
  .superRefine((doc, ctx) => {
    if (JSON.stringify(doc).length > maxRichTextBytes) {
      ctx.addIssue({ code: "custom", message: "Слишком длинный текст" });
    }
  });

export type RichTextDoc = z.infer<typeof richTextSchema>;
export type RichTextBlock = RichTextDoc["content"][number];
export type RichTextParagraph = Extract<RichTextBlock, { type: "paragraph" }>;
export type RichTextList = Extract<
  RichTextBlock,
  { type: "bulletList" | "orderedList" }
>;
export type RichTextListItem = RichTextList["content"][number];
export type RichTextInline = NonNullable<RichTextParagraph["content"]>[number];
export type RichTextText = Extract<RichTextInline, { type: "text" }>;
export type RichTextMark = NonNullable<RichTextText["marks"]>[number];

// Минимум символов считается по тексту документа: пробелы и разметка не в счёт.
export function richTextMin(min: number, message: string) {
  return richTextSchema.refine((doc) => {
    const length = richTextText(doc).replace(/\s+/gu, " ").trim().length;
    return length >= min;
  }, message);
}

// Текст документа: абзацы через пустую строку, элементы списка с маркером.
// Нужен письму приглашения и превью на главной — там разметки нет.
export function richTextText(doc: RichTextDoc): string {
  return doc.content
    .map((block) => {
      return blockPlainText(block);
    })
    .filter(Boolean)
    .join("\n\n");
}

function blockPlainText(block: RichTextBlock): string {
  if (block.type === "bulletList" || block.type === "orderedList") {
    return block.content
      .map((item) => {
        return item.content
          .map((paragraph) => {
            return inlinePlainText(paragraph.content ?? []);
          })
          .join("\n");
      })
      .map((line) => {
        return `- ${line}`;
      })
      .join("\n");
  }
  return inlinePlainText(block.content ?? []);
}

function inlinePlainText(nodes: RichTextInline[]): string {
  return nodes
    .map((node) => {
      return node.type === "text" ? node.text : "\n";
    })
    .join("");
}

// Черновик из обычного текста: пустая строка делит абзацы, перенос строки —
// жёсткий перенос внутри абзаца. Так сиды и шаблон приглашения становятся документом.
export function docFromPlainText(text: string): RichTextDoc {
  const paragraphs = text
    .split(/\n{2,}/u)
    .map((part) => {
      return part.trim();
    })
    .filter(Boolean);
  if (paragraphs.length === 0) {
    return emptyRichText();
  }
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => {
      return { type: "paragraph", content: plainLines(paragraph) };
    }),
  };
}

function plainLines(paragraph: string): RichTextInline[] {
  const lines = paragraph.split("\n");
  const nodes: RichTextInline[] = [];
  lines.forEach((line, index) => {
    if (line !== "") {
      nodes.push({ type: "text", text: line });
    }
    if (index < lines.length - 1) {
      nodes.push({ type: "hardBreak" });
    }
  });
  return nodes;
}

export function emptyRichText(): RichTextDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}
