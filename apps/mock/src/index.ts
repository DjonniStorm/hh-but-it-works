import { Elysia } from "elysia";

type Achievement = { title: string; year: number; place: number | null };

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
  .get("/health", () => ({ status: "ok", service: "mock" }))
  .get("/participants/:fspId", ({ params, status }) => {
    const row = participants[params.fspId];
    if (!row) {
      return status(404, { message: "История ФСП не найдена" });
    }
    return row;
  })
  .listen(3001);
