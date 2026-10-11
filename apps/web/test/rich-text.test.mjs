import assert from "node:assert/strict";
import test from "node:test";

import {
  docFromPlainText,
  emptyRichText,
  isHttpUrl,
  richTextHtml,
  richTextMin,
  richTextSchema,
  richTextText,
} from "../../../packages/contracts/src/rich-text.ts";

const doc = (content) => {
  return { type: "doc", content };
};

test("plain text becomes paragraphs split by blank line", () => {
  const result = docFromPlainText("Первый абзац.\n\nВторой абзац.");
  assert.deepEqual(result, {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Первый абзац." }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Второй абзац." }],
      },
    ],
  });
});

test("single newline inside a paragraph becomes hardBreak", () => {
  const result = docFromPlainText("Строка один\nСтрока два");
  assert.deepEqual(result.content[0].content, [
    { type: "text", text: "Строка один" },
    { type: "hardBreak" },
    { type: "text", text: "Строка два" },
  ]);
});

test("empty text yields an empty document that still passes the schema", () => {
  const result = emptyRichText();
  assert.ok(richTextSchema.safeParse(result).success);
});

test("text round-trips through the document", () => {
  const source = "Привет\n\nМир";
  assert.equal(richTextText(docFromPlainText(source)), "Привет\n\nМир");
});

test("schema accepts bold, italic and http links", () => {
  const result = richTextSchema.safeParse(
    doc([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "жирный", marks: [{ type: "bold" }] },
          { type: "text", text: " курсив", marks: [{ type: "italic" }] },
          {
            type: "text",
            text: " ссылка",
            marks: [{ type: "link", attrs: { href: "https://example.com" } }],
          },
        ],
      },
    ]),
  );
  assert.ok(result.success);
});

test("schema rejects javascript: links", () => {
  const result = richTextSchema.safeParse(
    doc([
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "x",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      },
    ]),
  );
  assert.ok(!result.success);
});

test("schema rejects script tags smuggled as unknown nodes", () => {
  const result = richTextSchema.safeParse(
    doc([
      { type: "paragraph", content: [{ type: "text", text: "ок" }] },
      { type: "script", content: [{ type: "text", text: "alert(1)" }] },
    ]),
  );
  assert.ok(!result.success);
});

test("schema rejects nested lists", () => {
  const result = richTextSchema.safeParse(
    doc([
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "внешний" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "вложенный" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]),
  );
  assert.ok(!result.success);
});

test("min-length counts text, not markup", () => {
  const schema = richTextMin(5, "Слишком коротко");
  const long = doc([
    {
      type: "paragraph",
      content: [{ type: "text", text: "a b c d e" }, { type: "hardBreak" }],
    },
  ]);
  assert.ok(schema.safeParse(long).success);
  const short = doc([
    {
      type: "paragraph",
      content: [{ type: "text", text: "a b" }],
    },
  ]);
  const parsed = schema.safeParse(short);
  assert.ok(!parsed.success);
  assert.equal(parsed.error.issues[0].message, "Слишком коротко");
});

test("schema accepts images with external http(s) links", () => {
  const result = richTextSchema.safeParse(
    doc([
      {
        type: "paragraph",
        content: [{ type: "text", text: "Фото команды:" }],
      },
      {
        type: "image",
        attrs: { src: "https://example.com/team.jpg", alt: "Команда" },
      },
      { type: "image", attrs: { src: "http://example.com/office.png" } },
    ]),
  );
  assert.ok(result.success);
});

test("schema rejects data: and javascript: image sources", () => {
  for (const src of ["data:image/png;base64,AAAA", "javascript:alert(1)"]) {
    const result = richTextSchema.safeParse(
      doc([{ type: "image", attrs: { src } }]),
    );
    assert.ok(!result.success, src);
  }
});

test("schema rejects an image inside a list item", () => {
  const result = richTextSchema.safeParse(
    doc([
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "пункт" }],
              },
              { type: "image", attrs: { src: "https://example.com/a.png" } },
            ],
          },
        ],
      },
    ]),
  );
  assert.ok(!result.success);
});

test("text extraction skips images", () => {
  const withImage = doc([
    { type: "paragraph", content: [{ type: "text", text: "До картинки" }] },
    { type: "image", attrs: { src: "https://example.com/a.png" } },
    { type: "paragraph", content: [{ type: "text", text: "После" }] },
  ]);
  assert.equal(richTextText(withImage), "До картинки\n\nПосле");
});

test("isHttpUrl accepts only full http(s) links", () => {
  assert.ok(isHttpUrl("https://example.com/x.png"));
  assert.ok(isHttpUrl("http://example.com"));
  assert.ok(!isHttpUrl("javascript:alert(1)"));
  assert.ok(!isHttpUrl("data:image/png;base64,AAAA"));
  assert.ok(!isHttpUrl("/local/path.png"));
  assert.ok(!isHttpUrl("example.com"));
});

test("html for letters escapes text and keeps only known tags", () => {
  const html = richTextHtml(
    doc([
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "жирный <script>",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Заголовок" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "пункт" }],
              },
            ],
          },
        ],
      },
    ]),
  );
  assert.ok(html.includes("<strong>жирный &lt;script&gt;</strong>"));
  assert.ok(html.includes("<h3"));
  assert.ok(html.includes("<ul"));
  assert.ok(html.includes("<li"));
  assert.ok(!html.includes("<script>"));
});

test("html for letters drops unsafe links and image sources", () => {
  const html = richTextHtml(
    doc([
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "ссылка",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      },
      { type: "image", attrs: { src: "javascript:alert(1)" } },
    ]),
  );
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("ссылка"));
});

test("html for letters wraps the image in a link with alt", () => {
  const html = richTextHtml(
    doc([
      {
        type: "image",
        attrs: { src: "https://example.com/photo.jpg", alt: "Фото" },
      },
    ]),
  );
  assert.ok(html.includes('href="https://example.com/photo.jpg"'));
  assert.ok(html.includes('alt="Фото"'));
});
