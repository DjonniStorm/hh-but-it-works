import type { Canvas, TextStyle } from "./canvas";
import { type ResumeContact, contactLabel } from "./contacts";
import { type Tone, palette, size, toneColors } from "./theme";

// Фото в анкете нет: на его месте красный квадрат с инициалами.
export function monogram(
  canvas: Canvas,
  x: number,
  top: number,
  side: number,
  initials: string,
  frame: boolean,
): void {
  if (frame) {
    canvas.rect(0, x - 3, top - side - 3, side + 6, side + 6, palette.white);
  }
  canvas.rect(0, x, top - side, side, side, palette.accent);
  const style: TextStyle = {
    font: "bold",
    size: side * 0.38,
    color: palette.white,
    tracking: 1,
  };
  const width = canvas.width(initials, style);
  canvas.text(
    0,
    initials,
    x + (side - width) / 2,
    top - side / 2 - style.size * 0.36,
    style,
  );
}

type Placed = {
  contact: ResumeContact;
  shown: string;
  dx: number;
  line: number;
};

export type ContactRow = { items: Placed[]; height: number };

const label = (tone: Tone): TextStyle => {
  return {
    font: "semibold",
    size: size.tiny,
    color: toneColors[tone].muted,
    tracking: 0.6,
  };
};

const value = (tone: Tone): TextStyle => {
  return { font: "regular", size: size.small, color: toneColors[tone].text };
};

const lineHeight = 14;
const itemGap = 14;

// Контакты в строку с переносом. Сначала раскладка, чтобы шапка знала свою высоту.
export function planContacts(
  canvas: Canvas,
  contacts: ResumeContact[],
  width: number,
  tone: Tone,
): ContactRow {
  const items: Placed[] = [];
  let dx = 0;
  let line = 0;
  for (const contact of contacts) {
    const caption =
      canvas.width(contactLabel[contact.kind].toUpperCase(), label(tone)) + 5;
    // Ссылка длиннее строки не должна уехать за край листа.
    const shown = canvas.clip(contact.value, value(tone), width - caption);
    const itemWidth = caption + canvas.width(shown, value(tone));
    if (dx > 0 && dx + itemWidth > width) {
      line += 1;
      dx = 0;
    }
    items.push({ contact, shown, dx, line });
    dx += itemWidth + itemGap;
  }
  return { items, height: contacts.length > 0 ? (line + 1) * lineHeight : 0 };
}

export function drawContacts(
  canvas: Canvas,
  row: ContactRow,
  x: number,
  top: number,
  tone: Tone,
): void {
  for (const { contact, shown, dx, line } of row.items) {
    const baseline = top - line * lineHeight - size.small;
    const caption = contactLabel[contact.kind].toUpperCase();
    canvas.text(0, caption, x + dx, baseline, label(tone));
    const valueX = x + dx + canvas.width(caption, label(tone)) + 5;
    canvas.text(0, shown, valueX, baseline, value(tone));
    const valueWidth = canvas.width(shown, value(tone));
    canvas.link(0, valueX, baseline - 3, valueWidth, lineHeight, contact.url);
  }
}
