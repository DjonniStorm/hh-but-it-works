const assert = require("node:assert/strict");
const test = require("node:test");

const {
  CandidatePoolService,
  profileFreshness,
} = require("../dist/modules/employers/candidate-pool.service.js");
const {
  EmployersService,
} = require("../dist/modules/employers/employers.service.js");
const {
  toBreakdown,
  toRankRequest,
} = require("../dist/modules/employers/ranking.client.js");

test("ranking request carries every live ML signal without PII", () => {
  const request = toRankRequest(
    {
      title: "Backend developer",
      specialization: "backend",
      gradeFrom: "middle",
      gradeTo: "senior",
      mustSkills: ["Node.js"],
      niceSkills: ["PostgreSQL"],
      workFormat: "remote",
      salaryFrom: 150000,
      salaryTo: 250000,
      description: "Backend Node.js service with PostgreSQL",
    },
    [
      {
        id: "candidate-1",
        alias: "Candidate #1",
        specialization: "backend",
        claimedGrade: "middle",
        verifiedGrade: "middle",
        gradeConfidence: 0.92,
        experienceYears: 4,
        skills: [
          {
            title: "Node.js",
            level: "strong",
            verification: "verified",
            score: 88,
          },
          {
            title: "PostgreSQL",
            level: null,
            verification: "unverified",
            score: null,
          },
        ],
        assessmentScore: 85,
        profileFreshness: 0.7,
        fspAchievements: [{ title: "Backend Cup", year: 2025, place: 1 }],
        preferences: {
          desiredSalaryFrom: 180000,
          workFormats: ["remote"],
          searchStatus: "actively-looking",
        },
      },
    ],
  );

  assert.deepEqual(request.vacancy.competencyWeights, {
    "Node.js": 1,
    PostgreSQL: 0.35,
  });
  assert.equal(request.vacancy.text, "Backend Node.js service with PostgreSQL");
  // Грейд middle..senior разворачивается в требования по стажу 3..15 лет.
  assert.equal(request.vacancy.experienceMin, 3);
  assert.equal(request.vacancy.experienceMax, 15);

  const candidate = request.candidates[0];
  assert.deepEqual(candidate.competencies, { "Node.js": 0.88 });
  assert.equal(candidate.profileText, "backend Node.js PostgreSQL");
  assert.equal(candidate.profileFreshness, 0.7);
  assert.equal(candidate.availability, "actively_looking");
  assert.deepEqual(candidate.fspEvidence, [
    { title: "Backend Cup", year: 2025, score: 0.9 },
  ]);
  assert.deepEqual(candidate.skills, [
    { id: "Node.js", level: 1, confidence: 0.88, verified: true },
    { id: "PostgreSQL", level: 0.5, confidence: 0.4, verified: false },
  ]);

  assert.equal("alias" in candidate, false);
  assert.equal("displayName" in candidate, false);
});

test("breakdown exposes the exact v1.2 scoring weights", () => {
  const components = {
    specialization: 1,
    grade: 1,
    experience: 1,
    semantic: 1,
    mustSkills: 1,
    verifiedMustSkills: 1,
    niceSkills: 1,
    competency: 1,
    assessment: 1,
    fspEvidence: 1,
    salary: 1,
    workMode: 1,
    targetRole: 1,
    freshness: 1,
  };

  const breakdown = toBreakdown(components);
  assert.deepEqual(
    breakdown.map(({ group, score }) => [group, score]),
    [
      ["category", 100],
      ["skills", 100],
      ["assessment", 100],
      ["fsp", 100],
      ["preferences", 100],
    ],
  );
  assert.equal(
    Number(breakdown.reduce((sum, item) => sum + item.weight, 0).toFixed(4)),
    1,
  );
  assert.match(
    breakdown.find((item) => item.group === "fsp").details[0],
    /Достижения ФСП: 100/,
  );
});

test("shortlist preserves model version and orders candidates by ranking", async () => {
  const need = {
    id: "need-1",
    userId: "employer-1",
    specialization: "backend",
  };
  const candidates = [
    { id: "candidate-low", assessmentScore: 99 },
    { id: "candidate-high", assessmentScore: 60 },
  ];
  const listed = [{ id: "profile-1" }, { id: "profile-2" }];
  const scores = new Map([
    [
      "candidate-low",
      {
        score: 35,
        qualification: 40,
        opportunityFit: 30,
        reasons: ["must_skills_1_of_2"],
        risks: ["skill_missing:sql"],
        breakdown: [],
      },
    ],
    [
      "candidate-high",
      {
        score: 91,
        qualification: 95,
        opportunityFit: 84,
        reasons: ["verified_grade_match"],
        risks: [],
        breakdown: [],
      },
    ],
  ]);

  const service = new EmployersService(
    {},
    {
      findOne: async ({ where }) => {
        assert.deepEqual(where, { id: "need-1", userId: "employer-1" });
        return need;
      },
    },
    {
      find: async () => [
        { needId: "need-1", candidateProfileId: "candidate-high" },
      ],
    },
    // Избранное потребности (need_favorites, #40): пусто.
    { find: async () => [] },
    {
      listed: async () => listed,
      eligible: (actualNeed, actualListed) => {
        assert.equal(actualNeed, need);
        assert.equal(actualListed, listed);
        return actualListed;
      },
      snapshots: async (profiles) => {
        assert.equal(profiles, listed);
        return candidates;
      },
    },
    {
      rank: async (actualNeed, actualCandidates) => {
        assert.equal(actualNeed, need);
        assert.equal(actualCandidates, candidates);
        return { modelVersion: "hybrid-v1.2.0-ltr0.25", scores };
      },
    },
  );

  const shortlist = await service.shortlist("employer-1", "need-1");
  assert.equal(shortlist.modelVersion, "hybrid-v1.2.0-ltr0.25");
  assert.deepEqual(
    shortlist.items.map((item) => item.candidate.id),
    ["candidate-high", "candidate-low"],
  );
  assert.equal(shortlist.items[0].dismissed, true);
  assert.equal(shortlist.items[0].matchScore, 91);
  assert.equal(shortlist.items[1].dismissed, false);
  assert.deepEqual(shortlist.items[1].risks, ["skill_missing:sql"]);
});

test("profile freshness has stable six and twelve month boundaries", () => {
  const now = Date.UTC(2026, 9, 8);
  const daysAgo = (days) => new Date(now - days * 86_400_000);

  assert.equal(profileFreshness(daysAgo(0), now), 1);
  assert.equal(profileFreshness(daysAgo(180), now), 1);
  assert.equal(profileFreshness(daysAgo(181), now), 0.7);
  assert.equal(profileFreshness(daysAgo(365), now), 0.7);
  assert.equal(profileFreshness(daysAgo(366), now), 0.4);
  assert.equal(profileFreshness(new Date(now + 86_400_000), now), 1);
});

test("candidate pool admits only verified grades", () => {
  const pool = new CandidatePoolService({}, {}, {}, {});
  const profiles = [
    {
      id: "verified-middle",
      specialization: "backend",
      claimedGrade: "junior",
      verifiedGrade: "middle",
    },
    {
      id: "claimed-only",
      specialization: "backend",
      claimedGrade: "middle",
      verifiedGrade: null,
    },
    {
      id: "verified-too-low",
      specialization: "backend",
      claimedGrade: "senior",
      verifiedGrade: "junior",
    },
    {
      id: "wrong-specialization",
      specialization: "frontend",
      claimedGrade: "senior",
      verifiedGrade: "senior",
    },
  ];

  const eligible = pool.eligible(
    { specialization: "backend", gradeFrom: "senior", gradeTo: "senior" },
    profiles,
  );
  assert.deepEqual(
    eligible.map((profile) => profile.id),
    ["verified-middle"],
  );
});
