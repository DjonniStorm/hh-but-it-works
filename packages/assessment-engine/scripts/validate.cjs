// Валидация правил оценки на синтетических кандидатах. Запуск: pnpm --filter @hh/assessment-engine validate
const {
  buildAttempt,
  gradeAttempt,
  coreSkills,
  bank,
  catalogSlugs,
} = require("../dist/index.js");
const { mulberry32 } = require("../dist/random.js");
const { Grade, Specialization } = require("@hh/types");

const grades = [Grade.Junior, Grade.Middle, Grade.Senior];
const candidatesPerLevel = Number(process.env.CANDIDATES ?? 400);
const perSection = process.env.PER_SECTION
  ? Number(process.env.PER_SECTION)
  : undefined;
const rng = mulberry32(20261006);

// Вероятность угадать без знаний по формату задания.
const guessByKind = {
  single: 0.25,
  code: 0.25,
  multiple: 0.1,
  numeric: 0.02,
  order: 0.05,
};

function normal() {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Сложность задания по шкале грейдов: junior 1, middle 2, senior 3, difficulty сдвигает на полшага.
function hardness(grade, difficulty) {
  return grades.indexOf(grade) + 1 + (difficulty - 2) * 0.5;
}

function solves(ability, item, grade) {
  const know =
    1 / (1 + Math.exp(-1.7 * (ability - hardness(grade, item.difficulty))));
  const guess = guessByKind[item.kind];
  return rng() < guess + (1 - guess) * know;
}

function answersFor(ability, secret) {
  return secret.items.map((item) => {
    const correct = solves(ability, item, secret.grade);
    if (item.kind === "numeric") {
      return {
        itemId: item.itemId,
        choices: [],
        value: correct ? item.value : (item.value ?? 0) + 1,
      };
    }
    return {
      itemId: item.itemId,
      choices: correct ? item.correct : [],
      value: null,
    };
  });
}

function skillsFor(specialization) {
  const slugs = [...coreSkills[specialization]];
  if (!slugs.includes("docker")) {
    slugs.push("docker");
  }
  return slugs.map((slug) => {
    return { skillId: slug, slug };
  });
}

function sit(ability, specialization, grade, seed) {
  const built = buildAttempt({
    grade,
    skills: skillsFor(specialization),
    seed,
    perSection,
  });
  return {
    built,
    result: gradeAttempt(built.secret, answersFor(ability, built.secret)),
  };
}

// Измеренный грейд: старший, на котором попытка сдана, идём снизу вверх до первого провала.
function measuredLevel(ability, specialization, seed) {
  let level = 0;
  for (const grade of grades) {
    if (!sit(ability, specialization, grade, seed + level).result.passed) {
      break;
    }
    level += 1;
  }
  return level;
}

function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

const specializations = Object.values(Specialization);
const confusion = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
const retestPass = { same: 0, total: 0 };
const retestScores = { first: [], second: [] };
const templateStats = new Map();
let seed = 1;

for (let level = 1; level <= 3; level += 1) {
  for (let index = 0; index < candidatesPerLevel; index += 1) {
    const specialization = specializations[index % specializations.length];
    // Истинный уровень с разбросом внутри грейда.
    const ability = level + 0.35 + normal() * 0.3;
    seed += 7;

    confusion[level][measuredLevel(ability, specialization, seed * 13)] += 1;

    const grade = grades[level - 1];
    const first = sit(ability, specialization, grade, seed);
    const second = sit(ability, specialization, grade, seed + 100003);
    retestPass.total += 1;
    retestPass.same += first.result.passed === second.result.passed ? 1 : 0;
    retestScores.first.push(first.result.score);
    retestScores.second.push(second.result.score);

    // Для дискриминативности сравниваем ответ на задание с баллом попытки у всех уровней на одном грейде.
    for (const target of grades) {
      const { result } = sit(ability, specialization, target, seed + 7919);
      for (const outcome of result.items) {
        const key = `${target}:${outcome.templateId}`;
        const stat = templateStats.get(key) ?? { rows: [] };
        stat.rows.push({
          correct: outcome.correct ? 1 : 0,
          score: result.score,
        });
        templateStats.set(key, stat);
      }
    }
  }
}

const matched = [1, 2, 3].reduce(
  (sum, level) => sum + confusion[level][level],
  0,
);
const total = candidatesPerLevel * 3;
const within = [1, 2, 3].reduce((sum, level) => {
  return (
    sum +
    confusion[level][level] +
    (confusion[level][level - 1] ?? 0) +
    (confusion[level][level + 1] ?? 0)
  );
}, 0);

const discrimination = [];
for (const [key, stat] of templateStats) {
  if (stat.rows.length < 40) {
    continue;
  }
  const sorted = [...stat.rows].sort((a, b) => a.score - b.score);
  const cut = Math.floor(sorted.length * 0.27);
  const low = sorted.slice(0, cut);
  const high = sorted.slice(-cut);
  const rate = (rows) => rows.reduce((s, r) => s + r.correct, 0) / rows.length;
  discrimination.push({ key, d: rate(high) - rate(low), n: stat.rows.length });
}
discrimination.sort((a, b) => a.d - b.d);

// Вариативность: сколько заданий совпадает у двух попыток с разными seed.
let overlap = 0;
let overlapRuns = 0;
for (let run = 0; run < 300; run += 1) {
  const skills = skillsFor(Specialization.Backend);
  const a = buildAttempt({ grade: Grade.Middle, skills, seed: run * 31 + 1 });
  const b = buildAttempt({ grade: Grade.Middle, skills, seed: run * 31 + 2 });
  const ids = new Set(a.secret.items.map((item) => item.templateId));
  const prompts = new Set(
    a.items.map((item) => item.prompt + item.choices.join("|")),
  );
  const sameTemplates = b.secret.items.filter((item) =>
    ids.has(item.templateId),
  ).length;
  const samePrompts = b.items.filter((item) =>
    prompts.has(item.prompt + item.choices.join("|")),
  ).length;
  overlap += sameTemplates / b.items.length;
  overlapRuns += samePrompts / b.items.length;
}

const bankSize = catalogSlugs.map((slug) => {
  return `${slug}: ${grades.map((grade) => bank[slug][grade].length).join("/")}`;
});

const percent = (value) => `${(value * 100).toFixed(1)} %`;
const lines = [];
lines.push(
  `Кандидатов: ${total} (${candidatesPerLevel} на грейд), заданий на секцию: ${perSection ?? "по умолчанию"}`,
);
lines.push(`Банк, шаблонов junior/middle/senior: ${bankSize.join(", ")}`);
lines.push("");
lines.push("Истинный → измеренный (нет / junior / middle / senior):");
for (let level = 1; level <= 3; level += 1) {
  lines.push(`  ${grades[level - 1]}: ${confusion[level].join(" / ")}`);
}
lines.push(
  `Совпадение грейда: ${percent(matched / total)}, в пределах соседнего: ${percent(within / total)}`,
);
lines.push(
  `Повторная попытка на свой грейд, тот же итог: ${percent(retestPass.same / retestPass.total)}`,
);
lines.push(
  `Корреляция баллов при пересдаче: ${pearson(retestScores.first, retestScores.second).toFixed(2)}`,
);
lines.push("");
const meanD =
  discrimination.reduce((s, r) => s + r.d, 0) / discrimination.length;
const weak = discrimination.filter((r) => r.d < 0.2);
lines.push(
  `Дискриминативность (верх 27 % минус низ 27 %): средняя ${meanD.toFixed(2)}, ниже 0.2: ${weak.length} из ${discrimination.length}`,
);
for (const row of weak.slice(0, 10)) {
  lines.push(`  ${row.key}: ${row.d.toFixed(2)} (n=${row.n})`);
}
lines.push("");
lines.push(
  `Две попытки middle-бэкенда: общих шаблонов ${percent(overlap / 300)}, одинаковых формулировок с вариантами ${percent(overlapRuns / 300)}`,
);

console.log(lines.join("\n"));
