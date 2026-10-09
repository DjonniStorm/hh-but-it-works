import type { PDFDocument } from "pdf-lib";

import { ResumeTemplate } from "@hh/types";

import { Canvas, type Fonts, type TextStyle, baseline } from "./canvas";
import { Column } from "./column";
import {
  contactListHeight,
  drawContactList,
  drawContactRow,
  monogram,
  planContactRow,
} from "./header-parts";
import type { ResumeData } from "./resume-data";
import {
  headerContacts,
  mainSections,
  sidebarSections,
  summary,
} from "./sections";
import { Tone, page, palette, rhythm, size } from "./theme";

// Геометрия снята с эталонных PDF Reactive Resume (A4, поля 14 pt, боковая колонка 35%).
type Layout = (doc: PDFDocument, fonts: Fonts, data: ResumeData) => Canvas;

const { width: W, height: H, padding: P, sidebar: S } = page;
const mainX = S + P;
const mainWidth = W - mainX - P;
const sidebarWidth = S - P * 2;

const nameStyle = (fontSize: number): TextStyle => {
  return { font: "serif", size: fontSize, color: palette.white };
};

const headlineStyle: TextStyle = {
  font: "regular",
  size: size.body,
  color: palette.white,
};

const noop = () => {
  return undefined;
};

// Ditto: графитовая полоса с именем, плитка с инициалами заходит на неё снизу.
const ditto: Layout = (doc, fonts, data) => {
  const canvas = new Canvas(doc, fonts, noop);
  const band = 63.5;
  const side = 100;
  const tileTop = H - 24;
  canvas.rect(0, 0, H - band, W, band, palette.block);
  monogram(canvas, (mainX - side) / 2, tileTop, side, data.initials, {
    fill: palette.tint,
    ink: palette.primary,
    radius: 0,
  });
  const name = canvas.fit(data.name, nameStyle(size.name), mainWidth, 12);
  canvas.text(0, data.name, mainX, H - 30, name);
  const headline = canvas.clip(data.headline, headlineStyle, mainWidth);
  canvas.text(0, headline, mainX, H - 46, headlineStyle);

  const contactLine = 18;
  const contactsTop = H - band - 6;
  const contacts = headerContacts(data);
  const row = planContactRow(
    canvas,
    contacts,
    mainWidth,
    contactLine,
    Tone.Light,
  );
  drawContactRow(canvas, row, mainX, contactsTop, contactLine, Tone.Light);

  const mainTop = contactsTop - row.height - 12;
  const main = new Column(canvas, mainX, mainWidth, mainTop, false);
  mainSections(main, data, true);
  const sidebarTop = tileTop - side - 10;
  const sidebar = new Column(canvas, P, sidebarWidth, sidebarTop, false);
  sidebarSections(sidebar, data);
  return canvas;
};

// Gengar: боковая колонка на подложке, сверху графитовая плитка с именем и контактами,
// справа сверху — подложка со сводкой.
const gengar: Layout = (doc, fonts, data) => {
  const side = 100;
  const nameSize = size.name;
  const nameLine = nameSize * 1.3;
  const contactLine = 18;
  const contacts = headerContacts(data);
  // Высоты считаем до рисования: подложка не должна лежать под плиткой, иначе на стыке шов.
  const measure = new Canvas(doc, fonts, noop);
  const nameLines = measure.wrap(data.name, nameStyle(nameSize), sidebarWidth);
  const headlineLines = measure.wrap(
    data.headline,
    headlineStyle,
    sidebarWidth,
  );
  const tile =
    P +
    side +
    7 +
    nameLines.length * nameLine +
    headlineLines.length * rhythm.line +
    6 +
    contactListHeight(contacts, contactLine) +
    P;
  const summaryLines = measure.wrap(data.summary, headlineStyle, mainWidth);
  const strip = P * 2 + summaryLines.length * rhythm.line;

  const canvas = new Canvas(doc, fonts, (index) => {
    const height = index === 0 ? H - tile : H;
    canvas.rect(index, 0, 0, S, height, palette.tint);
  });
  canvas.rect(0, 0, H - tile, S, tile, palette.block);
  canvas.rect(0, S, H - strip, W - S, strip, palette.tint);
  monogram(canvas, P, H - P, side, data.initials, {
    fill: palette.blockSoft,
    ink: palette.white,
    radius: 0,
  });
  let top = H - P - side - 7;
  for (const line of nameLines) {
    canvas.text(
      0,
      line,
      P,
      baseline(top, nameLine, nameSize),
      nameStyle(nameSize),
    );
    top -= nameLine;
  }
  for (const line of headlineLines) {
    canvas.text(
      0,
      line,
      P,
      baseline(top, rhythm.line, size.body),
      headlineStyle,
    );
    top -= rhythm.line;
  }
  top -= 6;
  drawContactList(
    canvas,
    contacts,
    P,
    top,
    sidebarWidth,
    contactLine,
    Tone.Dark,
  );

  const lead = new Column(canvas, mainX, mainWidth, H - P, true);
  summary(lead, data.summary);
  const main = new Column(canvas, mainX, mainWidth, H - strip - 10, true);
  mainSections(main, data, false);
  const sidebar = new Column(canvas, P, sidebarWidth, H - tile - 10, true);
  sidebarSections(sidebar, data);
  return canvas;
};

// Pikachu: слева скруглённая плитка с инициалами, справа скруглённая графитовая карточка.
const pikachu: Layout = (doc, fonts, data) => {
  const canvas = new Canvas(doc, fonts, noop);
  const left = 199;
  const cardX = P + left + P;
  const cardWidth = W - cardX - P;
  const pad = 13.6;
  const inner = cardWidth - pad * 2;
  const nameLine = 27;
  const contactLine = 16.5;
  const contacts = headerContacts(data);
  const row = planContactRow(canvas, contacts, inner, contactLine, Tone.Dark);
  const card = pad + nameLine + rhythm.line + 8 + 4.5 + row.height + pad;
  const top = H - P;

  canvas.roundedRect(0, cardX, top, cardWidth, card, 6, palette.block);
  const side = Math.min(card, left);
  monogram(canvas, P + (left - side) / 2, top, side, data.initials, {
    fill: palette.tint,
    ink: palette.primary,
    radius: 6,
  });
  let y = top - pad;
  const name = canvas.fit(data.name, nameStyle(size.nameLarge), inner, 12);
  canvas.text(
    0,
    data.name,
    cardX + pad,
    baseline(y, nameLine, name.size),
    name,
  );
  y -= nameLine;
  const headline = canvas.clip(data.headline, headlineStyle, inner);
  canvas.text(
    0,
    headline,
    cardX + pad,
    baseline(y, rhythm.line, size.body),
    headlineStyle,
  );
  y -= rhythm.line + 8;
  canvas.rect(0, cardX + pad, y, inner, 0.75, palette.onBlockRule);
  y -= 4.5;
  drawContactRow(canvas, row, cardX + pad, y, contactLine, Tone.Dark);

  const main = new Column(canvas, cardX, cardWidth, top - card - 10, true);
  mainSections(main, data, true);
  const sidebar = new Column(canvas, P, left, top - side - 12, true);
  sidebarSections(sidebar, data);
  return canvas;
};

export const layouts: Record<ResumeTemplate, Layout> = {
  [ResumeTemplate.Ditto]: ditto,
  [ResumeTemplate.Gengar]: gengar,
  [ResumeTemplate.Pikachu]: pikachu,
};
