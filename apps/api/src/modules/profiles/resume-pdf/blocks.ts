import { type Canvas, type TextStyle, baseline } from "./canvas";
import type { Column } from "./column";
import type { ResumeEntry, ResumeFact } from "./resume-data";
import { palette, rhythm, size, toneColors } from "./theme";

const barHeight = 7.5;
const bulletSide = 3;
const bulletIndent = 12;
const bulletTextIndent = 22;
// Уже этой ширины период записи уходит под заголовок, как в боковой колонке Reactive Resume.
const stackBelow = 260;

export function textStyle(
  col: Column,
  font: TextStyle["font"] = "regular",
  fontSize: number = size.body,
): TextStyle {
  return { font, size: fontSize, color: toneColors[col.tone].text };
}

// Строки абзаца. Каждая строка сама проверяет, есть ли место на листе.
export function paragraph(
  col: Column,
  value: string,
  style: TextStyle,
  lineHeight: number = rhythm.line,
  indent = 0,
): void {
  const lines = col.canvas.wrap(value, style, col.width - indent);
  for (const line of lines) {
    col.reserve(lineHeight);
    const y = baseline(col.y, lineHeight, style.size);
    col.canvas.text(col.index, line, col.x + indent, y, style);
    col.gap(lineHeight);
  }
}

// Заголовок раздела: Merriweather цвета primary. keep — место под первую строку,
// чтобы заголовок не остался один внизу листа.
export function heading(col: Column, title: string, keep = 30): void {
  col.reserve(rhythm.headingLine + 4 + keep);
  const style: TextStyle = {
    font: "serif",
    size: size.heading,
    color: palette.primary,
  };
  const y = baseline(col.y, rhythm.headingLine, size.heading);
  col.canvas.text(col.index, title, col.x, y, style);
  col.gap(rhythm.headingLine);
  if (col.headingRule) {
    col.canvas.rect(col.index, col.x, col.y - 1, col.width, 0.75, style.color);
    col.gap(5);
    return;
  }
  col.gap(2);
}

// Шкала из делений: закрашенные цвета primary, остальные — рамка.
export function levelBar(
  canvas: Canvas,
  index: number,
  x: number,
  top: number,
  width: number,
  filled: number,
  steps: number,
): void {
  const step = width / steps;
  for (let item = 0; item < steps; item += 1) {
    const left = x + item * step;
    if (item < filled) {
      canvas.rect(
        index,
        left,
        top - barHeight,
        step,
        barHeight,
        palette.primary,
      );
    }
    canvas.frame(
      index,
      left,
      top - barHeight,
      step,
      barHeight,
      palette.primary,
    );
  }
}

export const levelBarHeight = barHeight;

// Сплошная шкала с долей share: результат теста.
export function progressBar(col: Column, share: number): void {
  col.reserve(barHeight + 8);
  const top = col.y - 2;
  const clamped = Math.min(Math.max(share, 0), 1);
  col.canvas.rect(
    col.index,
    col.x,
    top - barHeight,
    col.width * clamped,
    barHeight,
    palette.primary,
  );
  col.canvas.frame(
    col.index,
    col.x,
    top - barHeight,
    col.width,
    barHeight,
    palette.primary,
  );
  col.gap(barHeight + 8);
}

// Пары «подпись — значение»: стаж, формат работы, зарплата.
export function facts(col: Column, list: ResumeFact[]): void {
  list.forEach((fact, position) => {
    if (position > 0) {
      col.gap(rhythm.item / 2);
    }
    col.reserve(rhythm.line * 2);
    paragraph(col, fact.label, textStyle(col, "semibold"));
    paragraph(col, fact.value, textStyle(col));
  });
}

// Записи раздела: опыт, образование, достижения. Заголовок полужирный, период справа.
export function entries(col: Column, title: string, list: ResumeEntry[]) {
  if (list.length === 0) {
    return;
  }
  heading(col, title);
  list.forEach((value, position) => {
    if (position > 0) {
      col.gap(rhythm.item);
    }
    entry(col, value);
  });
  col.gap(rhythm.section);
}

function entry(col: Column, value: ResumeEntry): void {
  const strong = textStyle(col, "semibold");
  const plain = textStyle(col);
  if (col.width < stackBelow) {
    col.reserve(rhythm.line * 2);
    paragraph(col, value.title, strong);
    paragraph(col, value.period, plain);
  } else {
    const periodWidth = col.canvas.width(value.period, plain);
    const lines = col.canvas.wrap(
      value.title,
      strong,
      col.width - periodWidth - 12,
    );
    col.reserve(rhythm.line * (lines.length + 1));
    const y = baseline(col.y, rhythm.line, size.body);
    const periodX = col.x + col.width - periodWidth;
    col.canvas.text(col.index, value.period, periodX, y, plain);
    for (const line of lines) {
      const lineY = baseline(col.y, rhythm.line, size.body);
      col.canvas.text(col.index, line, col.x, lineY, strong);
      col.gap(rhythm.line);
    }
  }
  if (value.subtitle) {
    paragraph(col, value.subtitle, plain);
  }
  for (const detail of value.details) {
    bullet(col, detail, plain);
  }
}

// Пункт списка: квадратный маркер, как у Reactive Resume.
function bullet(col: Column, value: string, style: TextStyle): void {
  col.gap(3);
  col.reserve(rhythm.line);
  const markerTop = col.y - rhythm.line / 2 + bulletSide / 2;
  col.canvas.rect(
    col.index,
    col.x + bulletIndent,
    markerTop - bulletSide,
    bulletSide,
    bulletSide,
    style.color,
  );
  paragraph(col, value, style, rhythm.line, bulletTextIndent);
}
