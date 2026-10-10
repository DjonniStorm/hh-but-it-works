import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";

// Перечисления руками: mock не зависит от @hh/types (CJS-сборка, bun её не тянет).
// Значения те же, что FspAchievementKind / FspAchievementLevel / FspSportRank в @hh/types.
const kindEnum = t.Enum(
  {
    Competition: "competition",
    Cup: "cup",
    Olympiad: "olympiad",
    Hackathon: "hackathon",
    Diploma: "diploma",
    Certificate: "certificate",
  },
  { description: "Тип достижения: соревнование, кубок, олимпиада, документ" },
);

const levelEnum = t.Enum(
  {
    Regional: "regional",
    Interregional: "interregional",
    AllRussia: "all_russia",
    Russia: "russia",
    International: "international",
  },
  { description: "Уровень соревнования; null, если уровень не указан" },
);

const sportRankEnum = t.Enum(
  {
    Rank3: "rank3",
    Rank2: "rank2",
    Rank1: "rank1",
    Kms: "kms",
    Ms: "ms",
    Msmk: "msmk",
  },
  { description: "Спортивный разряд; null, если разряд не присвоен" },
);

// Те же поля, что fspAchievementSchema в @hh/contracts: их читает FspClient в API.
// t.Number, а не t.Integer: у Elysia t.Integer принимает и строку, в спеке это лишний anyOf.
const achievementSchema = t.Object({
  title: t.String({ description: "Название соревнования или документа" }),
  year: t.Number({ description: "Год проведения" }),
  place: t.Nullable(
    t.Number({
      minimum: 1,
      description: "Занятое место; null, если место не присуждено",
    }),
  ),
  kind: kindEnum,
  level: t.Nullable(levelEnum),
  organizer: t.Nullable(
    t.String({ description: "Кто проводил соревнование, например ФСП" }),
  ),
});

// Участник реестра: спортивные данные плюс история выступлений.
const participantSchema = t.Object(
  {
    fspId: t.String({
      description: "Идентификатор участника, например fsp-b101",
    }),
    name: t.String({ description: "Имя и фамилия, как в реестре" }),
    email: t.String({
      description: "Почта, на которую участник зарегистрирован в реестре",
      example: "seed.b101@candidates.hh.test",
    }),
    sportRank: t.Nullable(sportRankEnum),
    rating: t.Nullable(
      t.Number({ description: "Позиция в рейтинге ФСП; null, если нет" }),
    ),
    achievements: t.Array(achievementSchema),
  },
  { description: "Участник реестра ФСП" },
);

type Participant = typeof participantSchema.static;

// Те же люди, что в сиде кандидатов API (apps/api/src/modules/profiles/candidate-seed.data.ts):
// fspId сид-кандидата — "fsp-" + его код, почта — seed.<код>@candidates.hh.test.
// Названия, годы и места соревнований совпадают с сидом; kind/level/organizer и
// отдельные документы — домен мока, их в сиде нет.
const participants: Record<string, Participant> = {
  "fsp-demo": {
    fspId: "fsp-demo",
    name: "Демо Участник",
    email: "seed.demo@candidates.hh.test",
    sportRank: null,
    rating: null,
    achievements: [
      {
        title: "Открытый чемпионат",
        year: 2026,
        place: null,
        kind: "competition",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-b101": {
    fspId: "fsp-b101",
    name: "Артём Кузнецов",
    email: "seed.b101@candidates.hh.test",
    sportRank: "ms",
    rating: 1842,
    achievements: [
      {
        title: "Всероссийский чемпионат по продуктовому программированию",
        year: 2025,
        place: 2,
        kind: "cup",
        level: "all_russia",
        organizer: "ФСП",
      },
      {
        title: "Сертификат наставника сборной команды",
        year: 2026,
        place: null,
        kind: "certificate",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-b103": {
    fspId: "fsp-b103",
    name: "Мария Соколова",
    email: "seed.b103@candidates.hh.test",
    sportRank: "kms",
    rating: 1290,
    achievements: [
      {
        title: "Кубок России по спортивному программированию",
        year: 2026,
        place: null,
        kind: "cup",
        level: "russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-b104": {
    fspId: "fsp-b104",
    name: "Дмитрий Орлов",
    email: "seed.b104@candidates.hh.test",
    sportRank: "ms",
    rating: 2075,
    achievements: [
      {
        title: "Чемпионат России по спортивному программированию",
        year: 2025,
        place: 1,
        kind: "competition",
        level: "russia",
        organizer: "ФСП",
      },
      {
        title: "Всероссийская олимпиада ФСП",
        year: 2024,
        place: 3,
        kind: "olympiad",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-b107": {
    fspId: "fsp-b107",
    name: "Сергей Волков",
    email: "seed.b107@candidates.hh.test",
    sportRank: "rank1",
    rating: 980,
    achievements: [
      {
        title: "Кубок России по спортивному программированию",
        year: 2025,
        place: 5,
        kind: "cup",
        level: "russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-b108": {
    fspId: "fsp-b108",
    name: "Никита Ершов",
    email: "seed.b108@candidates.hh.test",
    sportRank: "kms",
    rating: 1105,
    achievements: [
      {
        title: "Региональный этап ФСП",
        year: 2026,
        place: 2,
        kind: "competition",
        level: "regional",
        organizer: "ФСП",
      },
      {
        title: "Грамота за волонтёрство на региональном этапе",
        year: 2026,
        place: null,
        kind: "diploma",
        level: "regional",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-f202": {
    fspId: "fsp-f202",
    name: "Ольга Новикова",
    email: "seed.f202@candidates.hh.test",
    sportRank: "ms",
    rating: 1533,
    achievements: [
      {
        title: "Всероссийский хакатон ФСП",
        year: 2025,
        place: 1,
        kind: "hackathon",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-f205": {
    fspId: "fsp-f205",
    name: "Павел Морозов",
    email: "seed.f205@candidates.hh.test",
    sportRank: "rank1",
    rating: 760,
    achievements: [
      {
        title: "Чемпионат России по спортивному программированию",
        year: 2026,
        place: 4,
        kind: "competition",
        level: "russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-f206": {
    fspId: "fsp-f206",
    name: "Екатерина Лебедева",
    email: "seed.f206@candidates.hh.test",
    sportRank: "kms",
    rating: 1340,
    achievements: [
      {
        title: "Всероссийский чемпионат по продуктовому программированию",
        year: 2026,
        place: 3,
        kind: "cup",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-d301": {
    fspId: "fsp-d301",
    name: "Алексей Фёдоров",
    email: "seed.d301@candidates.hh.test",
    sportRank: "ms",
    rating: 1610,
    achievements: [
      {
        title: "Всероссийская олимпиада ФСП",
        year: 2025,
        place: 2,
        kind: "olympiad",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-s401": {
    fspId: "fsp-s401",
    name: "Виктор Павлов",
    email: "seed.s401@candidates.hh.test",
    sportRank: "ms",
    rating: 2201,
    achievements: [
      {
        title:
          "Всероссийские соревнования по информационной безопасности (CTF)",
        year: 2025,
        place: 1,
        kind: "competition",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
  "fsp-s403": {
    fspId: "fsp-s403",
    name: "Ирина Смирнова",
    email: "seed.s403@candidates.hh.test",
    sportRank: "rank2",
    rating: 640,
    achievements: [
      {
        title:
          "Всероссийские соревнования по информационной безопасности (CTF)",
        year: 2026,
        place: 3,
        kind: "competition",
        level: "all_russia",
        organizer: "ФСП",
      },
      {
        title: "Сертификат ФСП по информационной безопасности",
        year: 2026,
        place: null,
        kind: "certificate",
        level: "all_russia",
        organizer: "ФСП",
      },
    ],
  },
};

const notFoundSchema = t.Object(
  { message: t.String() },
  { description: "Участник в реестре не найден" },
);

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
          version: "2.0.0",
          description:
            "Реестр ФСП: участники, разряды, рейтинг и достижения. " +
            "Люди и соревнования совпадают с сидом кандидатов API " +
            "(apps/api/src/modules/profiles/candidate-seed.data.ts).",
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
      detail: { summary: "Проверка доступности мока" },
      response: {
        200: t.Object(
          { status: t.Literal("ok"), service: t.Literal("mock") },
          { description: "Мок доступен" },
        ),
      },
    },
  )
  // Регистрируется раньше /participants/:fspId, чтобы статический сегмент by-email не перекрылся параметром.
  .get(
    "/participants/by-email/:email",
    ({ params, status }) => {
      const email = params.email.toLowerCase();
      const row = Object.values(participants).find(
        (participant) => participant.email === email,
      );
      if (!row) {
        return status(404, { message: "История ФСП не найдена" });
      }
      return row;
    },
    {
      params: t.Object({
        email: t.String({
          description:
            "Почта участника; URL-кодируется, например seed.b101%40candidates.hh.test",
          example: "seed.b101@candidates.hh.test",
        }),
      }),
      detail: {
        summary: "Участник по почте",
        description:
          "Импорт при регистрации: кандидат вводит почту, API ищет участника с ней. " +
          "404 — почты нет в реестре.",
      },
      response: {
        200: participantSchema,
        404: notFoundSchema,
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
        fspId: t.String({
          description: "Идентификатор участника, например fsp-b101",
        }),
      }),
      detail: {
        summary: "Участник по идентификатору",
        description: "404 — такого участника в реестре нет.",
      },
      response: {
        200: participantSchema,
        404: notFoundSchema,
      },
    },
  )
  .listen(3001);
