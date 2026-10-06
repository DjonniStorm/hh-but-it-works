import { Grade } from "@hh/types";

import { between, pick, sample } from "../random";
import type { Template } from "../types";

const { Junior, Middle, Senior } = Grade;

export const testing: Template[] = [
  {
    id: "tst-passed",
    topic: "basics",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const failed = between(rng, 1, 9);
      const total = failed + between(rng, 5, 60);
      return {
        kind: "numeric",
        prompt: `В прогоне ${total} тестов, упало ${failed}, пропущенных нет. Сколько прошло?`,
        answer: total - failed,
      };
    },
  },
  {
    id: "tst-branches",
    topic: "coverage",
    grades: [Junior, Middle],
    difficulty: 2,
    build: (rng) => {
      const branches = between(rng, 2, 6);
      return {
        kind: "numeric",
        prompt: `В функции одна цепочка if / else if / else на ${branches} ветки. Сколько тестов нужно минимум, чтобы каждая ветка выполнилась хотя бы раз?`,
        answer: branches,
      };
    },
  },
  {
    id: "tst-line-coverage",
    topic: "coverage",
    grades: [Junior, Middle],
    difficulty: 1,
    build: (rng) => {
      const total = pick(rng, [200, 400, 500, 1000]);
      const percent = 5 * between(rng, 10, 19);
      return {
        kind: "numeric",
        prompt: `Из ${total} строк тесты выполнили ${(total * percent) / 100}. Какое покрытие строк в процентах?`,
        answer: percent,
      };
    },
  },
  {
    id: "tst-pyramid",
    topic: "pyramid",
    grades: [Junior, Middle],
    difficulty: 1,
    build: () => {
      return {
        kind: "single",
        prompt:
          "Каких тестов в классической пирамиде должно быть больше всего?",
        correct: "Модульных",
        wrong: ["E2E", "Ручных", "Нагрузочных"],
      };
    },
  },
  {
    id: "tst-arrange-act-assert",
    topic: "structure",
    grades: [Junior],
    difficulty: 1,
    build: (rng) => {
      const subject = pick(rng, ["корзины", "регистрации", "расчёта скидки"]);
      return {
        kind: "order",
        prompt: `Расставьте шаги модульного теста ${subject}.`,
        steps: [
          "Подготовить данные",
          "Вызвать проверяемый код",
          "Проверить результат",
        ],
      };
    },
  },
  {
    id: "tst-mock-call",
    topic: "mocks",
    grades: [Middle, Senior],
    difficulty: 2,
    build: (rng) => {
      const action = pick(rng, [
        "отправил письмо",
        "записал событие в аудит",
        "списал деньги",
      ]);
      return {
        kind: "single",
        prompt: `Нужно проверить, что сервис ${action} ровно один раз. Что подойдёт?`,
        correct: "Mock или spy с проверкой числа вызовов",
        wrong: [
          "Stub, который возвращает фиксированное значение",
          "Snapshot-тест",
          "Нагрузочный тест",
        ],
      };
    },
  },
  {
    id: "tst-flaky-cause",
    topic: "flaky",
    grades: [Middle, Senior],
    difficulty: 2,
    build: () => {
      return {
        kind: "single",
        prompt:
          "Тест иногда падает без изменений кода. Какая причина встречается чаще всего?",
        correct: "Зависимость от времени, порядка запуска или общего состояния",
        wrong: [
          "Слишком много проверок в одном тесте",
          "Тест написан на TypeScript",
          "У теста длинное название",
        ],
      };
    },
  },
  {
    id: "tst-isolation",
    topic: "flaky",
    grades: [Senior],
    difficulty: 3,
    build: (rng) => {
      return {
        kind: "multiple",
        prompt:
          "Что делает интеграционные тесты с базой независимыми друг от друга?",
        correct: sample(
          rng,
          [
            "Транзакция с откатом после каждого теста",
            "Отдельная схема или база на прогон",
            "Тест сам создаёт нужные ему данные",
          ],
          between(rng, 2, 3),
        ),
        wrong: [
          "Общий пользователь из фикстуры, которого правят все тесты",
          "Запуск тестов строго в одном порядке",
        ],
      };
    },
  },
  {
    id: "tst-tdd-cycle",
    topic: "tdd",
    grades: [Middle, Senior],
    difficulty: 2,
    build: () => {
      return {
        kind: "order",
        prompt: "Расставьте шаги одного цикла TDD.",
        steps: [
          "Написать падающий тест",
          "Написать минимальный код, чтобы тест прошёл",
          "Отрефакторить, сохраняя тесты зелёными",
        ],
      };
    },
  },
  {
    id: "tst-boundaries",
    topic: "design",
    grades: [Middle],
    difficulty: 2,
    build: (rng) => {
      const from = between(rng, 14, 21);
      const to = from + between(rng, 30, 50);
      return {
        kind: "numeric",
        prompt: `Функция принимает возраст от ${from} до ${to} включительно. Сколько значений нужно для граничных тестов: каждая граница и значение сразу за ней?`,
        answer: 4,
      };
    },
  },
  {
    id: "tst-contract",
    topic: "contracts",
    grades: [Senior],
    difficulty: 3,
    build: () => {
      return {
        kind: "single",
        prompt:
          "Как проверить, что фронт и бэк не разойдутся по формату API, без полного e2e?",
        correct: "Контрактные тесты по общей схеме",
        wrong: [
          "Снапшоты интерфейса",
          "Нагрузочный тест",
          "Ручная проверка в Swagger",
        ],
      };
    },
  },
];
