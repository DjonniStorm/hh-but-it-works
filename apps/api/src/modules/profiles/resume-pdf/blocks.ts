import type { RGB } from "pdf-lib";

import type { Canvas, TextStyle } from "./canvas";
import type { Column } from "./column";
import { type ResumeContact, contactLabel } from "./contacts";
import type { ResumeEntry, ResumeFact } from "./resume-data";
import { palette, size, toneColors } from "./theme";

// Межстрочный интервал от кегля.
export function leading(fontSize: number): number {
  return fontSize * 1.42;
}

// Строки абзаца. Каждая строка сама проверяет, есть ли место на листе.
export function paragraph(col: Column, value: string, style: TextStyle): void {
  for (const line of col.canvas.wrap(value, style, col.width)) {
    col.reserve(leading(style.size));
    col.canvas.text(col.index, line, col.x, col.y - style.size, style);
    col.gap(leading(style.size));
  }
}

// Заголовок раздела: капс вразрядку и линия с красным началом.
// keep — сколько места оставить под первую строку, чтобы заголовок не висел внизу листа.
export function sectionTitle(col: Column, title: string, keep = 36): void {
  col.reserve(24 + keep);
  const colors = toneColors[col.tone];
  col.canvas.text(col.index, title.toUpperCase(), col.x, col.y - size.section, {
    font: "bold",
    size: size.section,
    color: colors.text,
    tracking: 0.9,
  });
  const ruleY = col.y - size.section - 6;
  col.canvas.rect(col.index, col.x, ruleY, col.width, 0.6, colors.rule);
  col.canvas.rect(col.index, col.x, ruleY - 0.5, 22, 1.6, palette.accent);
  col.gap(size.section + 16);
}

// Плашка с капсом: «ПОДТВЕРЖДЁН», «ТЕСТ». Возвращает ширину.
export function pill(
  canvas: Canvas,
  index: number,
  x: number,
  centerY: number,
  label: string,
  fill: RGB,
  ink: RGB,
): number {
  const style: TextStyle = {
    font: "bold",
    size: 6.2,
    color: ink,
    tracking: 0.5,
  };
  const width = canvas.width(label, style) + 8;
  canvas.rect(index, x, centerY - 5, width, 10, fill);
  canvas.text(index, label, x + 4, centerY - 2.2, style);
  return width;
}

export function factsBlock(col: Column, facts: ResumeFact[]): void {
  const colors = toneColors[col.tone];
  for (const fact of facts) {
    col.reserve(26);
    col.canvas.text(
      col.index,
      fact.label.toUpperCase(),
      col.x,
      col.y - size.tiny,
      {
        font: "semibold",
        size: size.tiny,
        color: colors.muted,
        tracking: 0.6,
      },
    );
    col.gap(size.tiny + 4);
    paragraph(col, fact.value, {
      font: "regular",
      size: size.body,
      color: colors.text,
    });
    col.gap(5);
  }
  col.gap(6);
}

// Контакты столбиком: подпись сверху, значение — ссылка.
export function contactsBlock(col: Column, contacts: ResumeContact[]): void {
  const colors = toneColors[col.tone];
  const value: TextStyle = {
    font: "regular",
    size: size.small,
    color: colors.text,
  };
  for (const contact of contacts) {
    col.reserve(24);
    col.canvas.text(
      col.index,
      contactLabel[contact.kind].toUpperCase(),
      col.x,
      col.y - size.tiny,
      {
        font: "semibold",
        size: size.tiny,
        color: colors.muted,
        tracking: 0.6,
      },
    );
    col.gap(size.tiny + 4);
    for (const line of col.canvas.wrap(contact.value, value, col.width)) {
      col.reserve(leading(value.size));
      col.canvas.text(col.index, line, col.x, col.y - value.size, value);
      const width = col.canvas.width(line, value);
      col.canvas.link(
        col.index,
        col.x,
        col.y - leading(value.size),
        width,
        leading(value.size),
        contact.url,
      );
      col.gap(leading(value.size));
    }
    col.gap(5);
  }
}

// Высота contactsBlock без рисования: Gengar красит под контактами графит до текста.
export function contactsHeight(
  canvas: Canvas,
  contacts: ResumeContact[],
  width: number,
): number {
  const value: TextStyle = {
    font: "regular",
    size: size.small,
    color: palette.ink,
  };
  return contacts.reduce((total, contact) => {
    const lines = canvas.wrap(contact.value, value, width).length;
    return total + size.tiny + 4 + lines * leading(size.small) + 5;
  }, 0);
}

// Записи раздела: слева название и подзаголовок, справа красным период.
export function entriesBlock(
  col: Column,
  title: string,
  entries: ResumeEntry[],
) {
  if (entries.length === 0) {
    return;
  }
  sectionTitle(col, title);
  const colors = toneColors[col.tone];
  const period: TextStyle = {
    font: "mono",
    size: size.small,
    color: palette.accent,
  };
  const heading: TextStyle = {
    font: "semibold",
    size: size.body,
    color: colors.text,
  };
  const sub: TextStyle = {
    font: "regular",
    size: size.small,
    color: colors.muted,
  };
  for (const entry of entries) {
    const periodWidth = col.canvas.width(entry.period, period);
    const lines = col.canvas.wrap(
      entry.title,
      heading,
      col.width - periodWidth - 12,
    );
    col.reserve(leading(heading.size) * lines.length + leading(sub.size));
    col.canvas.text(
      col.index,
      entry.period,
      col.x + col.width - periodWidth,
      col.y - heading.size,
      period,
    );
    for (const line of lines) {
      col.canvas.text(col.index, line, col.x, col.y - heading.size, heading);
      col.gap(leading(heading.size));
    }
    if (entry.subtitle) {
      paragraph(col, entry.subtitle, sub);
    }
    for (const detail of entry.details) {
      paragraph(col, `• ${detail}`, { ...sub, color: colors.text });
    }
    col.gap(7);
  }
  col.gap(6);
}
