import type { Canvas } from "./canvas";
import { Tone, page as sheet } from "./theme";

// Колонка пишет сверху вниз и сама переходит на следующий лист.
// Две колонки одной раскладки листают независимо друг от друга.
export class Column {
  index = 0;
  y: number;

  constructor(
    readonly canvas: Canvas,
    readonly x: number,
    readonly width: number,
    top: number,
    // У Gengar и Pikachu под заголовком раздела линия, у Ditto нет.
    readonly headingRule: boolean,
    public tone: Tone = Tone.Light,
  ) {
    this.y = top;
  }

  // Если блок высотой height не влезает до нижнего поля, начинаем его на новом листе.
  reserve(height: number): void {
    if (this.y - height >= sheet.padding) {
      return;
    }
    this.index += 1;
    this.canvas.page(this.index);
    this.y = sheet.height - sheet.padding;
    // Продолжение колонки на следующих листах всегда на светлом фоне.
    this.tone = Tone.Light;
  }

  gap(height: number): void {
    this.y -= height;
  }
}
