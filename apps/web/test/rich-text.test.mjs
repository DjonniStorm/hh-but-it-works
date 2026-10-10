import assert from "node:assert/strict";
import test from "node:test";

import {
  docFromPlainText,
  emptyRichText,
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
      content: [
        { type: "text", text: "a b c d e" },
        { type: "hardBreak" },
      ],
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
