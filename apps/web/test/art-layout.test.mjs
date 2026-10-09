import assert from "node:assert/strict";
import test from "node:test";

import {
  appSlots,
  artLayouts,
  hashSeed,
} from "../src/shared/decor/model/art-layout.ts";

const arts = [
  "cat",
  "duck",
  "mug",
  "box",
  "terminal",
  "bug",
  "ghost",
  "printer",
];

// Фон на auth-страницах собирается из хеша почты/токена: одинаковый seed обязан
// давать одинаковую раскладку, а разные люди — разные.
test("hash of the same seed is stable", () => {
  assert.equal(hashSeed("user@example.com"), hashSeed("user@example.com"));
});

test("same seed produces the same backdrop", () => {
  const first = artLayouts("user@example.com", arts);
  const second = artLayouts("user@example.com", arts);
  assert.equal(first.length, 6);
  assert.deepEqual(first, second);
});

test("different seeds produce different backdrops", () => {
  const first = artLayouts("alice@example.com", arts);
  const second = artLayouts("bob@example.com", arts);
  assert.notDeepEqual(first, second);
});

// Вариант app: контента больше, поэтому фон реже (только углы) и прозрачнее.
test("app layout is sparser and fainter than auth", () => {
  const options = { slots: appSlots, opacity: [0.15, 0.25] };
  const auth = artLayouts("user@example.com", arts);
  const app = artLayouts("user@example.com", arts, options);
  assert.equal(auth.length, 6);
  assert.equal(app.length, 4);
  for (const piece of app) {
    assert.ok(Number(piece.style.opacity) <= 0.25);
  }
  // Статичность: одна почта — одна и та же раскладка при каждом рендере.
  assert.deepEqual(app, artLayouts("user@example.com", arts, options));
});
