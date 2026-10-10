const assert = require("node:assert/strict");
const test = require("node:test");

const { parseParticipant } = require("../dist/common/fsp/fsp.client.js");

test("parseParticipant читает поля реестра v2 и чистит битые значения", () => {
  const participant = parseParticipant({
    fspId: "fsp-b101",
    name: "Артём Кузнецов",
    sportRank: "ms",
    rating: 1842,
    achievements: [
      {
        title: "Чемпионат России",
        year: 2025,
        place: 1,
        kind: "competition",
        level: "russia",
        organizer: "ФСП",
      },
      {
        title: "Грамота за волонтёрство",
        year: 2026,
        place: null,
        kind: "diploma",
        level: null,
        organizer: null,
      },
      // Битые строки реестр не должен ронять: не число и вовсе без года.
      { title: 42, year: "2025", place: "1" },
      { year: 2024, place: 3 },
      {
        title: "Олимпиада",
        year: 2024,
        place: 3,
        kind: "olympiad",
        level: "неизвестный уровень",
        organizer: 7,
      },
    ],
  });

  assert.equal(participant?.fspId, "fsp-b101");
  assert.equal(participant?.name, "Артём Кузнецов");
  assert.equal(participant?.sportRank, "ms");
  assert.equal(participant?.rating, 1842);
  assert.equal(participant?.achievements.length, 3);

  const [championship, diploma, olympiad] = participant.achievements;
  assert.equal(championship.kind, "competition");
  assert.equal(championship.level, "russia");
  assert.equal(championship.organizer, "ФСП");
  assert.equal(diploma.place, null);
  assert.equal(diploma.organizer, null);
  // Неизвестный уровень и не-строка организатора — null, тип падает на competition.
  assert.equal(olympiad.level, null);
  assert.equal(olympiad.organizer, null);
});

test("parseParticipant отвергает чужеродное тело", () => {
  assert.equal(parseParticipant(null), null);
  assert.equal(parseParticipant("нет"), null);
  assert.equal(parseParticipant({ name: "Без ID" }), null);
  assert.equal(parseParticipant({ fspId: 42, name: "ID не строка" }), null);
  assert.equal(parseParticipant({ fspId: "fsp-demo" }), null);
});
