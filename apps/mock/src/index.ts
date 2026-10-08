import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";

// Те же поля, что fspAchievementSchema в @hh/contracts: их читает FspClient в API.
// t.Number, а не t.Integer: у Elysia t.Integer принимает и строку, в спеке это лишний anyOf.
const achievementSchema = t.Object({
  title: t.String({ description: "Название соревнования" }),
  year: t.Number({ description: "Год проведения" }),
  place: t.Nullable(
    t.Number({ minimum: 1, description: "Место; null — участие без места" }),
  ),
});

type Achievement = typeof achievementSchema.static;

// Те же люди, что в сиде кандидатов API (apps/api/src/modules/profiles/candidate-seed.data.ts).
// fspId сид-кандидата — "fsp-" + его код. Держать данные одинаковыми.
const participants: Record<string, { achievements: Achievement[] }> = {
  "fsp-demo": {
    achievements: [{ title: "Открытый чемпионат", year: 2026, place: null }],
  },
  "fsp-b101": {
    achievements: [
      {
        title: "Всероссийский чемпионат по продуктовому программированию",
        year: 2025,
        place: 2,
      },
    ],
  },
  "fsp-b103": {
    achievements: [
      {
        title: "Кубок России по спортивному программированию",
        year: 2026,
        place: null,
      },
    ],
  },
  "fsp-b104": {
    achievements: [
      {
        title: "Чемпионат России по спортивному программированию",
        year: 2025,
        place: 1,
      },
      { title: "Всероссийская олимпиада ФСП", year: 2024, place: 3 },
    ],
  },
  "fsp-b107": {
    achievements: [
      {
        title: "Кубок России по спортивному программированию",
        year: 2025,
        place: 5,
      },
    ],
  },
  "fsp-b108": {
    achievements: [{ title: "Региональный этап ФСП", year: 2026, place: 2 }],
  },
  "fsp-f202": {
    achievements: [
      { title: "Всероссийский хакатон ФСП", year: 2025, place: 1 },
    ],
  },
  "fsp-f205": {
    achievements: [
      {
        title: "Чемпионат России по спортивному программированию",
        year: 2026,
        place: 4,
      },
    ],
  },
  "fsp-f206": {
    achievements: [
      {
        title: "Всероссийский чемпионат по продуктовому программированию",
        year: 2026,
        place: 3,
      },
    ],
  },
  "fsp-d301": {
    achievements: [
      { title: "Всероссийская олимпиада ФСП", year: 2025, place: 2 },
    ],
  },
  "fsp-s401": {
    achievements: [
      {
        title:
          "Всероссийские соревнования по информационной безопасности (CTF)",
        year: 2025,
        place: 1,
      },
    ],
  },
  "fsp-s403": {
    achievements: [
      {
        title:
          "Всероссийские соревнования по информационной безопасности (CTF)",
        year: 2026,
        place: 3,
      },
    ],
  },
};

new Elysia()
  // Swagger UI на /docs, JSON на /docs/json — как у API.
  .use(
    openapi({
      path: "/docs",
      provider: "swagger-ui",
      // Та же версия Swagger UI, что у API, а не latest с CDN.
      swagger: { version: "5.32.13" },
      documentation: {
        info: {
          title: "Мок реестра ФСП",
          version: "1.0.0",
          description:
            "Достижения участников ФСП для подборки. Данные совпадают с сидом кандидатов API.",
        },
      },
    }),
  )
  .get(
    "/health",
    () => {
      return { status: "ok" as const, service: "mock" as const };
    },
    {
      detail: { summary: "Проверка, что мок жив" },
      response: {
        200: t.Object(
          { status: t.Literal("ok"), service: t.Literal("mock") },
          { description: "Мок работает" },
        ),
      },
    },
  )
  .get(
    "/participants/:fspId",
    ({ params, status }) => {
      const row = participants[params.fspId];
      if (!row) {
        return status(404, { message: "История ФСП не найдена" });
      }
      return row;
    },
    {
      params: t.Object({
        fspId: t.String({ description: "ID участника, например fsp-b101" }),
      }),
      detail: { summary: "Достижения участника ФСП" },
      response: {
        200: t.Object(
          { achievements: t.Array(achievementSchema) },
          { description: "Достижения участника" },
        ),
        404: t.Object(
          { message: t.String() },
          { description: "У участника нет истории в реестре" },
        ),
      },
    },
  )
  .listen(3001);
