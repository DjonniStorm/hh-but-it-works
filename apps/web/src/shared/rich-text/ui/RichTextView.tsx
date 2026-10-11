import type { ReactNode } from "react";

import { Anchor, List, Text, Title } from "@mantine/core";

import type {
  RichTextBlock,
  RichTextDoc,
  RichTextInline,
  RichTextList,
  RichTextMark,
} from "@hh/contracts";

type Props = {
  doc: RichTextDoc;
};

// Рендер документа ричтекста. Рисует только узлы из whitelist контракта —
// HTML из данных сюда не попадает в принципе, ссылки уходят с rel=noopener.
export const RichTextView = ({ doc }: Props) => {
  return (
    <>
      {doc.content.map((block, index) => {
        return <BlockView key={index} block={block} />;
      })}
    </>
  );
};

function BlockView({ block }: { block: RichTextBlock }) {
  // Картинка — внешний URL из документа: схема уже проверила http(s).
  if (block.type === "image") {
    return (
      <img
        src={block.attrs.src}
        alt={block.attrs.alt ?? ""}
        loading="lazy"
        style={{
          display: "block",
          maxWidth: "100%",
          marginBlock: "var(--mantine-spacing-sm)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      />
    );
  }
  if (block.type === "heading") {
    return <Title order={3}>{inlines(block.content)}</Title>;
  }
  if (block.type === "bulletList" || block.type === "orderedList") {
    return <ListView list={block} />;
  }
  return <Text size="sm">{inlines(block.content)}</Text>;
}

function ListView({ list }: { list: RichTextList }) {
  return (
    <List size="sm" spacing={4}>
      {list.content.map((item, index) => {
        return (
          <List.Item key={index}>
            {item.content.map((paragraph, paragraphIndex) => {
              return (
                <Text component="span" key={paragraphIndex}>
                  {inlines(paragraph.content)}
                </Text>
              );
            })}
          </List.Item>
        );
      })}
    </List>
  );
}

// Марки вкладываются: жирная ссылка — Anchor внутри strong.
function inlines(nodes: RichTextInline[] | undefined) {
  return nodes?.map((node, index) => {
    if (node.type === "hardBreak") {
      return <br key={index} />;
    }
    return <span key={index}>{marked(node.text, node.marks)}</span>;
  });
}

function marked(text: string, marks: RichTextMark[] | undefined) {
  return (marks ?? []).reduce<ReactNode>((content, mark) => {
    if (mark.type === "bold") {
      return <strong>{content}</strong>;
    }
    if (mark.type === "italic") {
      return <em>{content}</em>;
    }
    return (
      <Anchor href={mark.attrs.href} target="_blank" rel="noopener noreferrer">
        {content}
      </Anchor>
    );
  }, text);
}
