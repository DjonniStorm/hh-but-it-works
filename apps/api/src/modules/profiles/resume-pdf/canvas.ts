import {
  type PDFDocument,
  type PDFFont,
  type PDFPage,
  PDFString,
  type RGB,
  setCharacterSpacing,
} from "pdf-lib";

import { page as sheet } from "./theme";

export type Fonts = {
  regular: PDFFont;
  semibold: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
};

export type TextStyle = {
  font: keyof Fonts;
  size: number;
  color: RGB;
  // Разрядка в пунктах: заголовки разделов набраны капсом вразрядку.
  tracking?: number;
};

// Листы создаются по требованию: колонка, которой не хватило места, просит следующий.
// decorate рисует фон листа до текста, например боковую панель Gengar.
export class Canvas {
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly doc: PDFDocument,
    readonly fonts: Fonts,
    private readonly decorate: (page: PDFPage, index: number) => void,
  ) {}

  page(index: number): PDFPage {
    while (this.pages.length <= index) {
      const added = this.doc.addPage([sheet.width, sheet.height]);
      this.pages.push(added);
      this.decorate(added, this.pages.length - 1);
    }
    return this.pages[index];
  }

  width(value: string, style: TextStyle): number {
    const font = this.fonts[style.font];
    const tracking = (style.tracking ?? 0) * Math.max(value.length - 1, 0);
    return font.widthOfTextAtSize(value, style.size) + tracking;
  }

  text(
    index: number,
    value: string,
    x: number,
    y: number,
    style: TextStyle,
  ): void {
    const target = this.page(index);
    if (style.tracking) {
      target.pushOperators(setCharacterSpacing(style.tracking));
    }
    target.drawText(value, {
      x,
      y,
      size: style.size,
      font: this.fonts[style.font],
      color: style.color,
    });
    if (style.tracking) {
      target.pushOperators(setCharacterSpacing(0));
    }
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

  // Самый длинный размер шрифта, при котором строка влезает в ширину. Для имени в шапке.
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
