import type { RGB } from "pdf-lib";

import { type Canvas, type TextStyle, baseline } from "./canvas";
import { type ResumeContact, contactIcon } from "./contacts";
import { type Tone, rhythm, size, toneColors } from "./theme";

export type MonogramLook = { fill: RGB; ink: RGB; radius: number };

// Фото в анкете нет: на его месте плитка с инициалами того же размера.
export function monogram(
  canvas: Canvas,
  x: number,
  top: number,
  side: number,
  initials: string,
  look: MonogramLook,
): void {
  if (look.radius > 0) {
    canvas.roundedRect(0, x, top, side, side, look.radius, look.fill);
  } else {
    canvas.rect(0, x, top - side, side, side, look.fill);
  }
  const style: TextStyle = {
    font: "serif",
    size: Math.min(size.initials, side * 0.36),
    color: look.ink,
  };
  const width = canvas.width(initials, style);
  const y = top - side / 2 - style.size * 0.36;
  canvas.text(0, initials, x + (side - width) / 2, y, style);
}

const textX = size.icon + rhythm.iconGap;
const itemGap = 14;

function contactText(tone: Tone): TextStyle {
  return { font: "regular", size: size.body, color: toneColors[tone].text };
}

// Одна строка контакта: иконка, текст и ссылка поверх текста.
function drawContact(
  canvas: Canvas,
  contact: ResumeContact,
  shown: string,
  x: number,
  top: number,
  lineHeight: number,
  tone: Tone,
): void {
  const iconTop = top - (lineHeight - size.icon) / 2;
  const colors = toneColors[tone];
  canvas.icon(0, contactIcon[contact.kind], x, iconTop, size.icon, colors.icon);
  const style = contactText(tone);
  const y = baseline(top, lineHeight, size.body);
  canvas.text(0, shown, x + textX, y, style);
  const width = canvas.width(shown, style);
  canvas.link(0, x + textX, top - lineHeight, width, lineHeight, contact.url);
}

// Контакты столбиком, как в графитовой шапке Gengar.
export function contactListHeight(
  contacts: ResumeContact[],
  lineHeight: number,
): number {
  return contacts.length * lineHeight;
}

export function drawContactList(
  canvas: Canvas,
  contacts: ResumeContact[],
  x: number,
  top: number,
  width: number,
  lineHeight: number,
  tone: Tone,
): void {
  contacts.forEach((contact, position) => {
    const shown = canvas.clip(contact.value, contactText(tone), width - textX);
    const lineTop = top - position * lineHeight;
    drawContact(canvas, contact, shown, x, lineTop, lineHeight, tone);
  });
}

type Placed = {
  contact: ResumeContact;
  shown: string;
  dx: number;
  line: number;
};

export type ContactRow = { items: Placed[]; height: number };

// Контакты в строку с переносом (Ditto, Pikachu). Сначала раскладка, чтобы шапка знала высоту.
export function planContactRow(
  canvas: Canvas,
  contacts: ResumeContact[],
  width: number,
  lineHeight: number,
  tone: Tone,
): ContactRow {
  const items: Placed[] = [];
  let dx = 0;
  let line = 0;
  for (const contact of contacts) {
    // Ссылка длиннее строки не должна уехать за край листа.
    const shown = canvas.clip(contact.value, contactText(tone), width - textX);
    const itemWidth = textX + canvas.width(shown, contactText(tone));
    if (dx > 0 && dx + itemWidth > width) {
      line += 1;
      dx = 0;
    }
    items.push({ contact, shown, dx, line });
    dx += itemWidth + itemGap;
  }
  const height = contacts.length > 0 ? (line + 1) * lineHeight : 0;
  return { items, height };
}

export function drawContactRow(
  canvas: Canvas,
  row: ContactRow,
  x: number,
  top: number,
  lineHeight: number,
  tone: Tone,
): void {
  for (const { contact, shown, dx, line } of row.items) {
    const lineTop = top - line * lineHeight;
    drawContact(canvas, contact, shown, x + dx, lineTop, lineHeight, tone);
  }
}
