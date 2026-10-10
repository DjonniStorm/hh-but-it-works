import assert from "node:assert/strict";
import test from "node:test";

import { SkillVerification } from "@hh/types";

import {
  filterMaterials,
  isConfirmedSkill,
  materialsFor,
} from "../src/pages/home/model/materials.ts";

const confirmedSkill = (overrides = {}) => {
  return {
    skillId: "skill-1",
    slug: "javascript",
    title: "JavaScript",
    verification: SkillVerification.Verified,
    ...overrides,
  };
};

// Материалы уходят в карточки только для подтверждённых навыков из каталога:
// неподтверждённые темы кандидат не готовит, а чужие слаги пока пропускаем.
test("materialsFor берёт только подтверждённые навыки из каталога", () => {
  const profile = {
    skills: [
      confirmedSkill({}),
      confirmedSkill({
        skillId: "skill-2",
        slug: "react",
        title: "React",
        verification: SkillVerification.VerifiedExternal,
      }),
      confirmedSkill({ skillId: "skill-3", verification: null }),
      confirmedSkill({
        skillId: "skill-4",
        slug: "cobol",
        title: "Cobol",
      }),
    ],
  };
  const cards = materialsFor(profile);
  assert.deepEqual(
    cards.map((card) => {
      return card.skillId;
    }),
    ["skill-1", "skill-2"],
  );
  assert.ok(cards[0].links.length >= 2);
});

test("materialsFor по пустому профилю возвращает пусто", () => {
  assert.deepEqual(materialsFor(null), []);
});

test("filterMaterials ищет и по навыку, и по названиям ссылок", () => {
  const cards = materialsFor({ skills: [confirmedSkill({})] });
  assert.equal(filterMaterials(cards, "JAVASCRIPT").length, 1);
  assert.equal(filterMaterials(cards, "  mdn  ").length, 1);
  assert.equal(filterMaterials(cards, "ecma").length, 1);
  assert.equal(filterMaterials(cards, "").length, 1);
  assert.equal(filterMaterials(cards, "  ").length, 1);
  assert.equal(filterMaterials(cards, "cobol").length, 0);
});

test("isConfirmedSkill отличает подтверждение от самооценки", () => {
  assert.equal(isConfirmedSkill({ verification: null }), false);
  assert.equal(
    isConfirmedSkill({ verification: SkillVerification.Unverified }),
    false,
  );
  assert.equal(
    isConfirmedSkill({ verification: SkillVerification.Verified }),
    true,
  );
  assert.equal(
    isConfirmedSkill({ verification: SkillVerification.VerifiedExternal }),
    true,
  );
});
