import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";

import type { ResumeTemplate } from "@hh/types";

import type { Fonts } from "./canvas";
import { layouts } from "./layouts";
import type { ResumeData } from "./resume-data";

export type FontFiles = Record<keyof Fonts, Buffer>;

export async function renderResume(
  data: ResumeData,
  template: ResumeTemplate,
  files: FontFiles,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Стандартные шрифты pdf-lib не рисуют кириллицу. fontkit встраивает Inter и Merriweather.
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    regular: await doc.embedFont(files.regular, { subset: true }),
    semibold: await doc.embedFont(files.semibold, { subset: true }),
    serif: await doc.embedFont(files.serif, { subset: true }),
  };
  doc.setTitle(data.name);
  doc.setSubject(data.headline);
  doc.setLanguage("ru-RU");
  layouts[template](doc, fonts, data);
  return doc.save();
}
