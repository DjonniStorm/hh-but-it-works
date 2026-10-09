import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";

import type { ResumeTemplate } from "@hh/types";

import type { Canvas, Fonts, TextStyle } from "./canvas";
import { layouts } from "./layouts";
import type { ResumeData } from "./resume-data";
import { page, palette, size, text } from "./theme";

export type FontFiles = Record<keyof Fonts, Buffer>;

export async function renderResume(
  data: ResumeData,
  template: ResumeTemplate,
  files: FontFiles,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Стандартные шрифты pdf-lib не рисуют кириллицу. fontkit встраивает Inter и JetBrains Mono.
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    regular: await doc.embedFont(files.regular, { subset: true }),
    semibold: await doc.embedFont(files.semibold, { subset: true }),
    bold: await doc.embedFont(files.bold, { subset: true }),
    mono: await doc.embedFont(files.mono, { subset: true }),
  };
  doc.setTitle(data.name);
  doc.setSubject(data.headline);
  doc.setLanguage("ru-RU");
  const { canvas, footerX } = layouts[template](doc, fonts, data);
  footers(canvas, footerX, data.generatedAt);
  return doc.save();
}

// Колонтитул ставим последним: только тогда известно число листов.
function footers(canvas: Canvas, x: number, generatedAt: Date): void {
  const style: TextStyle = {
    font: "regular",
    size: size.tiny,
    color: palette.faint,
  };
  const mono: TextStyle = { ...style, font: "mono" };
  const caption = `${text.footer} ${generatedAt.toLocaleDateString("ru-RU")}`;
  const total = canvas.pages.length;
  canvas.pages.forEach((_sheet, index) => {
    canvas.text(index, caption, x, page.footer, style);
    const counter = `${index + 1}/${total}`;
    const right = page.width - page.margin - canvas.width(counter, mono);
    canvas.text(index, counter, right, page.footer, mono);
  });
}
