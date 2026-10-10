import type { CSSProperties } from "react";

// Фон auth-страниц собирается из хеша уникального поля (почта при вводе, токен подтверждения):
// один и тот же seed всегда даёт одну и ту же раскладку, разные люди получают разные.

export type ArtSlot = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  // Боковые слоты на узких экране мешают форме и там их скрывают.
  cornerOnly: boolean;
};

export type BackdropLayout<T> = {
  art: T;
  cornerOnly: boolean;
  style: CSSProperties;
};

// Слоты auth-страницы — углы и бока вокруг формы по центру.
const authSlots: ArtSlot[] = [
  { top: 7, left: 5, cornerOnly: false },
  { bottom: 9, left: 8, cornerOnly: false },
  { top: 9, right: 7, cornerOnly: false },
  { bottom: 7, right: 5, cornerOnly: false },
  { top: 44, left: 2, cornerOnly: true },
  { top: 42, right: 2, cornerOnly: true },
];

// Слоты фона основного приложения: только углы и реже — контента на экране больше.
export const appSlots: ArtSlot[] = [
  { top: 12, left: 7, cornerOnly: false },
  { top: 10, right: 8, cornerOnly: false },
  { bottom: 9, left: 8, cornerOnly: false },
  { bottom: 12, right: 7, cornerOnly: false },
];

export type ArtLayoutsOptions = {
  // Слоты под сцену: у приложения их меньше — фон разреженнее.
  slots?: readonly ArtSlot[];
  // Диапазон прозрачности: больше прозрачность — ненавязчивее картинки.
  opacity?: readonly [number, number];
};

// FNV-1a: короткий детерминированный хеш строки.
export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32: дешёвый генератор случайных из одного числа.
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Проценты слота шевелим на пару пунктов: даже совпавшие наборы картинок разъезжаются.
const jitter = (value: number, random: () => number): string => {
  return `${(value + random() * 6 - 3).toFixed(1)}%`;
};

const slotOffset = (slot: ArtSlot, random: () => number): CSSProperties => {
  const style: CSSProperties = {};
  if (slot.top !== undefined) {
    style.top = jitter(slot.top, random);
  }
  if (slot.bottom !== undefined) {
    style.bottom = jitter(slot.bottom, random);
  }
  if (slot.left !== undefined) {
    style.left = jitter(slot.left, random);
  }
  if (slot.right !== undefined) {
    style.right = jitter(slot.right, random);
  }
  return style;
};

// Из пула артов по seed берётся подмножество под слоты с личными размером и наклоном.
export function artLayouts<T>(
  seed: string,
  arts: readonly T[],
  options: ArtLayoutsOptions = {},
): BackdropLayout<T>[] {
  const { slots = authSlots, opacity = [0.45, 0.67] } = options;
  const [opacityMin, opacityMax] = opacity;
  const random = createRandom(hashSeed(seed));
  const chosen = arts
    .map((art) => {
      return { art, key: random() };
    })
    .sort((left, right) => {
      return left.key - right.key;
    })
    .slice(0, slots.length)
    .map((entry) => {
      return entry.art;
    });

  const layouts: BackdropLayout<T>[] = [];
  for (const [index, slot] of slots.entries()) {
    const art = chosen[index];
    if (art === undefined) {
      continue;
    }
    const vw = 11 + Math.round(random() * 6);
    layouts.push({
      art,
      cornerOnly: slot.cornerOnly,
      style: {
        ...slotOffset(slot, random),
        width: `clamp(110px, ${vw}vw, ${Math.round(vw * 13)}px)`,
        transform: `rotate(${Math.round(random() * 20 - 10)}deg)`,
        opacity: Number(
          (opacityMin + random() * (opacityMax - opacityMin)).toFixed(2),
        ),
      },
    });
  }
  return layouts;
}
