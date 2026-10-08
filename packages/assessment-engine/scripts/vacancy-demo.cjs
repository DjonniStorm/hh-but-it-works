// Сборка теста из вакансии. Запуск: pnpm --filter @hh/assessment-engine vacancy-demo
const { buildAttempt, planForNeed } = require("../dist/index.js");
const { Grade, Specialization } = require("@hh/types");

const needs = [
  {
    title: "Бэкенд-разработчик в платёжный сервис",
    specialization: Specialization.Backend,
    gradeFrom: Grade.Middle,
    mustSkills: ["PostgreSQL", "Docker"],
    niceSkills: ["Kafka"],
  },
  {
    title: "Фронтенд в личный кабинет",
    specialization: Specialization.Frontend,
    gradeFrom: Grade.Junior,
    mustSkills: ["TypeScript", "REST"],
    niceSkills: ["Jest"],
  },
  {
    title: "Аналитик данных в маркетинг",
    specialization: Specialization.Data,
    gradeFrom: Grade.Senior,
    mustSkills: ["SQL", "Python"],
    niceSkills: [],
  },
  {
    title: "Инженер AppSec",
    specialization: Specialization.Security,
    gradeFrom: Grade.Middle,
    mustSkills: ["Kubernetes", "OWASP"],
    niceSkills: ["OpenAPI"],
  },
];

for (const need of needs) {
  const plan = planForNeed(need);
  const built = buildAttempt({
    grade: plan.grade,
    skills: plan.slugs.map((slug) => {
      return { skillId: slug, slug };
    }),
    seed: 42,
  });
  const topics = new Map();
  for (const item of built.secret.items) {
    const list = topics.get(item.skillId) ?? [];
    list.push(`${item.topic} (${item.kind}, d${item.difficulty})`);
    topics.set(item.skillId, list);
  }
  console.log(`\n${need.title} — ${plan.grade}`);
  console.log(
    `  навыки вакансии: ${[...need.mustSkills, ...need.niceSkills].join(", ")}`,
  );
  console.log(`  без заданий в банке: ${plan.uncovered.join(", ") || "нет"}`);
  for (const section of built.sections) {
    console.log(
      `  секция ${section.slug}: ${topics.get(section.skillId).join("; ")}`,
    );
  }
}
