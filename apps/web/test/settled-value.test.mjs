// Контракт хука: возвращает само значение, а не массив (иначе деструктуризация
// на месте вызова превращает "" в undefined и роняет страницу).
import assert from "node:assert/strict";
import { test } from "node:test";

import { createElement } from "react";

import { renderToString } from "react-dom/server";

import { useSettledValue } from "../src/shared/decor/model/use-settled-value.ts";

test("useSettledValue returns a plain value, not a tuple", () => {
  let result;
  function Probe() {
    result = useSettledValue("a@b.ru");
    return null;
  }
  renderToString(createElement(Probe));
  assert.equal(typeof result, "string");
  assert.equal(result, "a@b.ru");
});

test("useSettledValue keeps empty value as empty string", () => {
  let result;
  function Probe() {
    result = useSettledValue("");
    return null;
  }
  renderToString(createElement(Probe));
  assert.equal(result, "");
});
