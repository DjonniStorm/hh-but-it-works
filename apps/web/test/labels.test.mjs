import assert from "node:assert/strict";
import test from "node:test";

import { mapShortlist } from "../src/shared/api/map-employer.ts";
import { matchGroupLabel, reasonText } from "../src/shared/lib/labels.ts";

test("ranking reason codes have human-readable labels", () => {
  assert.equal(
    reasonText("strong_competency:python"),
    "Сильная тема теста: python",
  );
  assert.equal(
    reasonText("semantic_overlap:backend,postgresql"),
    "Опыт пересекается с задачами: backend,postgresql",
  );
  assert.equal(
    reasonText("must_skills_2_of_3"),
    "2 из 3 обязательных технологий в профиле",
  );
  assert.equal(reasonText("future_reason"), "future_reason");
});

test("FSP remains a distinct explanation group", () => {
  assert.equal(matchGroupLabel.fsp, "Достижения ФСП");
});

test("shortlist mapper preserves profile freshness", () => {
  const mapped = mapShortlist({
    needId: "need-1",
    modelVersion: "hybrid-v1.1.0-ltr0.25",
    categories: [
      { grade: "middle", match: "exact", candidateCount: 1 },
      { grade: "senior", match: "adjacent", candidateCount: 0 },
    ],
    items: [
      {
        candidate: {
          id: "candidate-1",
          alias: "Candidate #1",
          specialization: "backend",
          claimedGrade: "middle",
          verifiedGrade: "middle",
          gradeConfidence: 0.9,
          experienceYears: 4,
          skills: [],
          assessmentScore: 85,
          profileFreshness: 0.7,
          fspAchievements: [],
          preferences: {
            desiredSalaryFrom: 180000,
            workFormats: ["remote"],
            searchStatus: "actively-looking",
          },
        },
        matchScore: 91,
        qualification: 95,
        opportunityFit: 84,
        reasons: ["verified_grade_match"],
        risks: [],
        breakdown: [],
        dismissed: false,
      },
    ],
  });

  assert.equal(mapped.items[0].candidate.profileFreshness, 0.7);
  assert.equal(mapped.modelVersion, "hybrid-v1.1.0-ltr0.25");
  assert.deepEqual(
    mapped.categories.map((category) => {
      return [category.grade, category.match, category.candidateCount];
    }),
    [
      ["middle", "exact", 1],
      ["senior", "adjacent", 0],
    ],
  );
});
