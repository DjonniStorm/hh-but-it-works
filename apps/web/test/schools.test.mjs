import assert from "node:assert/strict";
import test from "node:test";

import { schoolNames } from "../src/pages/profile/model/schools.ts";

// Список собирается скриптом apps/web/scripts/build-schools.mjs и попадает в подсказку
// анкеты: дубликаты мешают выбору, а несортированный список ломает ожидания по поиску.
test("school suggestions are free of duplicates", () => {
  const seen = new Set();
  for (const name of schoolNames) {
    const key = name.toLocaleLowerCase("ru");
    assert.equal(seen.has(key), false, `дубликат: ${name}`);
    seen.add(key);
  }
});

test("school suggestions are sorted in Russian order", () => {
  const sorted = [...schoolNames].sort((left, right) => {
    return left.localeCompare(right, "ru");
  });
  assert.deepEqual(schoolNames, sorted);
});
