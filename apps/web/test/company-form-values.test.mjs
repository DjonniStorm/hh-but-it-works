import assert from "node:assert/strict";
import test from "node:test";

import { observable } from "mobx";

import { companyFormValues } from "../src/pages/employer/model/company.ts";

// Регрессия: klona в Mantine клонирует значения формы вглубь на каждом
// сохранении поля и уходит в бесконечную рекурсию на observable-проксях.
test("companyFormValues clones the description object instead of the store reference", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Привет" }] },
    ],
  };
  const storeCompany = observable({
    name: "Парус",
    industry: "Финансы",
    description: doc,
    website: "",
    contactEmail: "",
    contactTelegram: "",
  });

  const values = companyFormValues(storeCompany);

  assert.notEqual(values.description, storeCompany.description);
  assert.deepEqual(values.description, doc);
});
