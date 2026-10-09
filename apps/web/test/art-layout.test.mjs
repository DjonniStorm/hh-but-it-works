import assert from "node:assert/strict";
import test from "node:test";

import { artLayouts, hashSeed } from "../src/shared/decor/model/art-layout.ts";

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
