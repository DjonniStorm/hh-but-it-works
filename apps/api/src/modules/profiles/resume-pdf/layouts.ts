import type { PDFDocument } from "pdf-lib";

import { ResumeTemplate } from "@hh/types";

import { contactsBlock, contactsHeight, leading } from "./blocks";
import { Canvas, type Fonts, type TextStyle } from "./canvas";
import { Column } from "./column";
import { drawContacts, monogram, planContacts } from "./header-parts";
import type { ResumeData } from "./resume-data";
import { mainSections, sidebarSections, summary } from "./sections";
import { Tone, page, palette, size } from "./theme";

// footerX — откуда начинать колонтитул: у Gengar слева панель, подпись уходит вправо.
export type Drawn = { canvas: Canvas; footerX: number };

type Layout = (doc: PDFDocument, fonts: Fonts, data: ResumeData) => Drawn;

const sidebarWidth = 160;
const gutter = 24;
const mainX = page.margin + sidebarWidth + gutter;
const mainWidth = page.width - mainX - page.margin;

const nameStyle = (fontSize: number, tone: Tone): TextStyle => {
  return {
    font: "bold",
    size: fontSize,
    color: tone === Tone.Dark ? palette.white : palette.ink,
  };
};

const headlineStyle: TextStyle = {
  font: "regular",
  size: size.headline,
  color: palette.inkMuted,
};

// Ditto: графитовая полоса с именем, квадрат с инициалами заходит на неё снизу.
const ditto: Layout = (doc, fonts, data) => {
  const canvas = new Canvas(doc, fonts, () => {
    return undefined;
  });
  const band = 108;
  const side = 104;
  const top = page.height;
  canvas.rect(0, 0, top - band, page.width, band, palette.ink);
  monogram(
    canvas,
    page.margin + (sidebarWidth - side) / 2,
    top - 22,
    side,
    data.initials,
    true,
  );
  const name = canvas.fit(
    data.name,
    nameStyle(size.name, Tone.Dark),
    mainWidth,
    14,
  );
  canvas.text(0, data.name, mainX, top - 50, name);
  canvas.text(
    0,
    canvas.clip(data.headline, headlineStyle, mainWidth),
    mainX,
    top - 72,
    headlineStyle,
  );

  const contacts = planContacts(canvas, data.contacts, mainWidth, Tone.Light);
  drawContacts(canvas, contacts, mainX, top - band - 14, Tone.Light);

  const sidebar = new Column(
    canvas,
    page.margin,
    sidebarWidth,
    top - 22 - side - 26,
  );
  sidebarSections(sidebar, data);
  const main = new Column(
    canvas,
    mainX,
    mainWidth,
    top - band - 14 - contacts.height - 16,
  );
  mainSections(main, data, true);
  return { canvas, footerX: page.margin };
};

// Gengar: боковая панель на всю высоту, сверху графитовая плитка с именем и контактами.
const gengar: Layout = (doc, fonts, data) => {
  const panel = 196;
  const inset = 24;
  const innerWidth = panel - inset * 2;
  const rightWidth = page.width - panel - inset - page.margin;
  const canvas = new Canvas(doc, fonts, (_page, index) => {
    canvas.rect(index, 0, 0, panel, page.height, palette.panel);
  });
  const top = page.height;
  const side = 84;
  const name = nameStyle(19, Tone.Dark);
  const nameLines = canvas.wrap(data.name, name, innerWidth);
  const headline: TextStyle = { ...headlineStyle, size: size.body };
  const headlineLines = canvas.wrap(data.headline, headline, innerWidth);
  const contactsTop =
    inset +
    side +
    16 +
    nameLines.length * leading(name.size) +
    4 +
    headlineLines.length * leading(headline.size) +
    16;
  const tile =
    contactsTop + contactsHeight(canvas, data.contacts, innerWidth) + 12;

  canvas.rect(0, 0, top - tile, panel, tile, palette.ink);
  monogram(canvas, inset, top - inset, side, data.initials, false);
  let y = top - inset - side - 16;
  for (const line of nameLines) {
    canvas.text(0, line, inset, y - name.size, name);
    y -= leading(name.size);
  }
  y -= 4;
  for (const line of headlineLines) {
    canvas.text(0, line, inset, y - headline.size, headline);
    y -= leading(headline.size);
  }
  const contacts = new Column(canvas, inset, innerWidth, top - contactsTop);
  contacts.tone = Tone.Dark;
  contactsBlock(contacts, data.contacts);

  // Справа сверху — светлая плашка со сводкой, как блок summary у оригинала.
  const body: TextStyle = {
    font: "regular",
    size: size.body,
    color: palette.ink,
  };
  const lines = canvas.wrap(data.summary, body, rightWidth);
  const strip = lines.length * leading(size.body) + inset * 2;
  canvas.rect(0, panel, top - strip, page.width - panel, strip, palette.panel);
  const lead = new Column(canvas, panel + inset, rightWidth, top - inset);
  summary(lead, data.summary);

  const sidebar = new Column(canvas, inset, innerWidth, top - tile - 24);
  sidebarSections(sidebar, data);
  const main = new Column(canvas, panel + inset, rightWidth, top - strip - 24);
  mainSections(main, data, false);
  return { canvas, footerX: panel + inset };
};

// Pikachu: слева крупный квадрат с инициалами, справа графитовая карточка с именем.
const pikachu: Layout = (doc, fonts, data) => {
  const canvas = new Canvas(doc, fonts, () => {
    return undefined;
  });
  const top = page.height - page.margin;
  const side = 120;
  const pad = 18;
  const inner = mainWidth - pad * 2;
  const contacts = planContacts(canvas, data.contacts, inner, Tone.Dark);
  const card = Math.max(side, pad + 26 + 20 + 14 + contacts.height + pad);

  monogram(
    canvas,
    page.margin + (sidebarWidth - side) / 2,
    top,
    side,
    data.initials,
    false,
  );
  canvas.rect(0, mainX, top - card, mainWidth, card, palette.ink);
  const name = canvas.fit(data.name, nameStyle(22, Tone.Dark), inner, 14);
  canvas.text(0, data.name, mainX + pad, top - pad - 22, name);
  canvas.text(
    0,
    canvas.clip(data.headline, headlineStyle, inner),
    mainX + pad,
    top - pad - 40,
    headlineStyle,
  );
  canvas.rect(0, mainX + pad, top - pad - 52, inner, 0.6, palette.inkRule);
  canvas.rect(0, mainX + pad, top - pad - 52.5, 22, 1.6, palette.accent);
  drawContacts(canvas, contacts, mainX + pad, top - pad - 60, Tone.Dark);

  const sidebar = new Column(
    canvas,
    page.margin,
    sidebarWidth,
    top - side - 24,
  );
  sidebarSections(sidebar, data);
  const main = new Column(canvas, mainX, mainWidth, top - card - 22);
  mainSections(main, data, true);
  return { canvas, footerX: page.margin };
};

export const layouts: Record<ResumeTemplate, Layout> = {
  [ResumeTemplate.Ditto]: ditto,
  [ResumeTemplate.Gengar]: gengar,
  [ResumeTemplate.Pikachu]: pikachu,
};
