import { Elysia } from "elysia";

const participants: Record<
  string,
  { achievements: { title: string; year: number }[] }
> = {
  "fsp-demo": { achievements: [{ title: "Открытый чемпионат", year: 2026 }] },
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
