import {
  type PDFDocument,
  type PDFFont,
  type PDFPage,
  PDFString,
  type RGB,
} from "pdf-lib";

import { type IconName, iconPath } from "./icons";
import { page as sheet } from "./theme";

export type Fonts = {
  regular: PDFFont;
  semibold: PDFFont;
  serif: PDFFont;
};

export type TextStyle = { font: keyof Fonts; size: number; color: RGB };

// Базовая линия строки высотой lineHeight, чей верх на top: текст по центру строки.
export function baseline(top: number, lineHeight: number, fontSize: number) {
  return top - (lineHeight - fontSize) / 2 - fontSize * 0.8;
}

// Листы создаются по требованию: колонка, которой не хватило места, просит следующий.
// decorate рисует фон листа до текста, например боковую подложку Gengar.
export class Canvas {
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly doc: PDFDocument,
    readonly fonts: Fonts,
    private readonly decorate: (index: number) => void,
  ) {}

  page(index: number): PDFPage {
    while (this.pages.length <= index) {
      this.pages.push(this.doc.addPage([sheet.width, sheet.height]));
      this.decorate(this.pages.length - 1);
    }
    return this.pages[index];
  }

  width(value: string, style: TextStyle): number {
    return this.fonts[style.font].widthOfTextAtSize(value, style.size);
  }

  text(
    index: number,
    value: string,
    x: number,
    y: number,
    style: TextStyle,
  ): void {
    this.page(index).drawText(value, {
      x,
      y,
      size: style.size,
      font: this.fonts[style.font],
      color: style.color,
    });
  }

  rect(
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    color: RGB,
  ): void {
    this.page(index).drawRectangle({ x, y, width, height, color });
  }

  // Рамка без заливки: пустое деление шкалы уровня.
  frame(
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    color: RGB,
  ): void {
    this.page(index).drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: color,
      borderWidth: 0.75,
    });
  }

  // Прямоугольник со скруглёнными углами: фото и карточка имени у Pikachu.
  roundedRect(
    index: number,
    x: number,
    top: number,
    width: number,
    height: number,
    radius: number,
    color: RGB,
  ): void {
    const r = radius;
    const path = [
      `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r}`,
      `V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height}`,
      `H ${r} A ${r} ${r} 0 0 1 0 ${height - r}`,
      `V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`,
    ].join(" ");
    this.page(index).drawSvgPath(path, { x, y: top, color });
  }

  // Иконка Phosphor квадратом side, левый верхний угол в (x, top).
  icon(
    index: number,
    name: IconName,
    x: number,
    top: number,
    side: number,
    color: RGB,
  ): void {
    this.page(index).drawSvgPath(iconPath[name], {
      x,
      y: top,
      scale: side / 256,
      color,
    });
  }

  // Самый крупный кегль, при котором строка влезает в ширину. Для имени в шапке.
  fit(value: string, style: TextStyle, width: number, min: number): TextStyle {
    let fitted = style;
    while (fitted.size > min && this.width(value, fitted) > width) {
      fitted = { ...fitted, size: fitted.size - 0.5 };
    }
    return fitted;
  }

  // Строка не шире width: лишнее заменяем многоточием.
  clip(value: string, style: TextStyle, width: number): string {
    if (this.width(value, style) <= width) {
      return value;
    }
    let shown = value;
    while (shown.length > 1 && this.width(`${shown}…`, style) > width) {
      shown = shown.slice(0, -1);
    }
    return `${shown.trimEnd()}…`;
  }

  // Перенос по словам. Слово длиннее строки (ссылка) режем по символам.
  wrap(value: string, style: TextStyle, width: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const word of value.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (this.width(next, style) <= width) {
        line = next;
        continue;
      }
      if (line) {
        lines.push(line);
      }
      line = "";
      for (const char of word) {
        if (line && this.width(line + char, style) > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) {
      lines.push(line);
    }
    return lines;
  }

  // Кликабельная область поверх уже нарисованного текста.
  link(
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    url: string,
  ): void {
    const target = this.page(index);
    const annotation = this.doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    });
    target.node.addAnnot(this.doc.context.register(annotation));
  }
}
