import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const here = dirname(fileURLToPath(import.meta.url));

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.CSSStyleSheet = class CSSStyleSheet {
  constructor() {
    this.cssRules = [];
  }
  replaceSync() {}
  insertRule() {
    return 0;
  }
};
dom.window.CSSStyleSheet = globalThis.CSSStyleSheet;
const fakeBBox = function fakeBBox() {
  const text = this.textContent ?? "";
  return { x: 0, y: 0, width: Math.max(80, String(text).length * 8), height: 28 };
};
dom.window.SVGElement.prototype.getBBox = fakeBBox;
dom.window.Element.prototype.getBBox = fakeBBox;

const { parseMermaidToExcalidraw } = await import(
  "@excalidraw/mermaid-to-excalidraw"
);

const definition = readFileSync(resolve(here, "fsp-login.mmd"), "utf8");
const { elements: skeleton } = await parseMermaidToExcalidraw(definition, {
  flowchart: { curve: "linear" },
  themeVariables: { fontSize: "18px" },
});

const BOX_W = 250;
const BOX_H = 96;
const GAP_X = 56;
const GAP_Y = 80;
const COLS = 3;
const PAD = 40;
const ink = "#1B1C21";
const brand = "#402FFF";
const fill = "#DEE0FF";
const paper = "#EDEDED";

const boxes = skeleton.filter((el) => {
  return el.type === "rectangle";
});
const arrows = skeleton.filter((el) => {
  return el.type === "arrow";
});

const base = () => {
  return {
    angle: 0,
    strokeColor: brand,
    backgroundColor: fill,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: Math.floor(Math.random() * 2_000_000_000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2_000_000_000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
};

const placed = new Map();
const out = [];

boxes.forEach((box, index) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = PAD + col * (BOX_W + GAP_X);
  const y = PAD + row * (BOX_H + GAP_Y);
  placed.set(box.id, { x, y, w: BOX_W, h: BOX_H });
  const textId = `${box.id}-label`;
  const label = box.label?.text ?? box.id;
  out.push({
    ...base(),
    id: box.id,
    type: "rectangle",
    x,
    y,
    width: BOX_W,
    height: BOX_H,
    boundElements: [
      { id: textId, type: "text" },
      ...arrows
        .filter((arrow) => {
          return arrow.start?.id === box.id || arrow.end?.id === box.id;
        })
        .map((arrow) => {
          return { id: arrow.id, type: "arrow" };
        }),
    ],
  });
  out.push({
    ...base(),
    id: textId,
    type: "text",
    x: x + 12,
    y: y + 28,
    width: BOX_W - 24,
    height: 40,
    text: label,
    originalText: label,
    fontSize: 16,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: box.id,
    lineHeight: 1.25,
    baseline: 18,
    strokeColor: ink,
    backgroundColor: "transparent",
    fillStyle: "solid",
    roundness: null,
    boundElements: null,
  });
});

const route = (from, to) => {
  const wraps = to.y > from.y && to.x < from.x;
  if (wraps) {
    const midY = from.y + from.h + GAP_Y / 2;
    return [
      [from.x + from.w / 2, from.y + from.h],
      [from.x + from.w / 2, midY],
      [to.x + to.w / 2, midY],
      [to.x + to.w / 2, to.y],
    ];
  }
  return [
    [from.x + from.w, from.y + from.h / 2],
    [to.x, to.y + to.h / 2],
  ];
};

for (const arrow of arrows) {
  const from = placed.get(arrow.start.id);
  const to = placed.get(arrow.end.id);
  if (!from || !to) {
    continue;
  }
  const pts = route(from, to);
  const originX = pts[0][0];
  const originY = pts[0][1];
  const rel = pts.map((pt) => {
    return [pt[0] - originX, pt[1] - originY];
  });
  const last = rel[rel.length - 1];
  out.push({
    ...base(),
    id: arrow.id,
    type: "arrow",
    x: originX,
    y: originY,
    width: last[0],
    height: last[1],
    roundness: { type: 2 },
    backgroundColor: "transparent",
    points: rel,
    startBinding: { elementId: arrow.start.id, focus: 0, gap: 4 },
    endBinding: { elementId: arrow.end.id, focus: 0, gap: 4 },
    startArrowhead: null,
    endArrowhead: "arrow",
    lastCommittedPoint: null,
  });
}

const scene = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements: out,
  appState: {
    viewBackgroundColor: paper,
    gridSize: null,
  },
  files: {},
};

const excalidrawPath = resolve(here, "../site/excalidraw/fsp-login.excalidraw");
await writeFile(excalidrawPath, JSON.stringify(scene, null, 2), "utf8");

const rows = Math.ceil(boxes.length / COLS);
const svgW = PAD * 2 + COLS * BOX_W + (COLS - 1) * GAP_X;
const svgH = PAD * 2 + rows * BOX_H + (rows - 1) * GAP_Y;
const svgParts = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
  `<rect width="100%" height="100%" fill="${paper}"/>`,
];
for (const [id, box] of placed) {
  const label = boxes.find((item) => {
    return item.id === id;
  })?.label?.text ?? id;
  svgParts.push(
    `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="12" fill="${fill}" stroke="${brand}" stroke-width="2"/>`,
  );
  svgParts.push(
    `<foreignObject x="${box.x + 10}" y="${box.y + 18}" width="${box.w - 20}" height="${box.h - 36}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:16px JetBrains Mono,monospace;color:${ink};text-align:center;display:flex;align-items:center;justify-content:center;height:100%">${label}</div></foreignObject>`,
  );
}
for (const arrow of arrows) {
  const from = placed.get(arrow.start.id);
  const to = placed.get(arrow.end.id);
  if (!from || !to) {
    continue;
  }
  const d = route(from, to)
    .map((pt, i) => {
      return `${i === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`;
    })
    .join(" ");
  svgParts.push(
    `<path d="${d}" fill="none" stroke="${brand}" stroke-width="2" marker-end="url(#arrow)"/>`,
  );
}
svgParts.splice(
  2,
  0,
  `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${brand}"/></marker></defs>`,
);
svgParts.push("</svg>");

const svgPath = resolve(here, "../site/public/diagrams/fsp-login.svg");
await writeFile(svgPath, svgParts.join("\n"), "utf8");
console.log(`wrote ${excalidrawPath}`);
console.log(`wrote ${svgPath}`);
