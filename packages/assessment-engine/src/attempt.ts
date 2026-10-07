import type { Grade } from "@hh/types";

import { bank, isCatalogSlug } from "./bank";
import { type Rng, mixSeed, mulberry32, shuffle } from "./random";
import type {
  AttemptAnswer,
  ItemKind,
  PublicItem,
  SecretItem,
  Task,
  Template,
} from "./types";

export const sectionPassScore = 70;
export const attemptPassScore = 70;
// Секция ниже пола валит попытку, даже если средний балл проходной.
export const sectionFloorScore = 50;
// Уверенный результат: можно предлагать тест на грейд выше.
export const confidentScore = 90;
export const itemsPerSection = 4;

const secondsByKind: Record<ItemKind, number> = {
  single: 60,
  numeric: 75,
  code: 90,
  multiple: 90,
  order: 120,
};

export type AttemptSkill = {
  skillId: string;
  slug: string;
};

export type BuildAttemptInput = {
  grade: Grade;
  skills: AttemptSkill[];
  seed: number;
  perSection?: number;
};

export type AttemptSection = {
  skillId: string;
  slug: string;
  count: number;
};

export type AttemptSecret = {
  grade: Grade;
  items: SecretItem[];
};

export type BuiltAttempt = {
  sections: AttemptSection[];
  items: PublicItem[];
  secret: AttemptSecret;
};

export type SectionScore = {
  skillId: string;
  score: number;
  passed: boolean;
};

export type ItemOutcome = {
  itemId: string;
  templateId: string;
  correct: boolean;
};

export type AttemptGrade = {
  passed: boolean;
  score: number;
  grade: Grade;
  sections: SectionScore[];
  items: ItemOutcome[];
};

export class EmptyAttemptError extends Error {
  constructor() {
    super("Empty attempt");
    this.name = "EmptyAttemptError";
  }
}

export function buildAttempt(input: BuildAttemptInput): BuiltAttempt {
  const perSection = input.perSection ?? itemsPerSection;
  const skills = uniqueSkills(input.skills).sort((left, right) => {
    return left.slug.localeCompare(right.slug);
  });
  const sections: AttemptSection[] = [];
  const items: PublicItem[] = [];
  const secretItems: SecretItem[] = [];

  for (const skill of skills) {
    if (!isCatalogSlug(skill.slug)) {
      continue;
    }
    const rng = mulberry32(mixSeed(input.seed, skill.slug));
    const chosen = chooseTemplates(
      rng,
      bank[skill.slug][input.grade],
      perSection,
    );
    if (chosen.length === 0) {
      continue;
    }
    for (const template of chosen) {
      const itemId = `item-${items.length}`;
      const rendered = render(template.build(rng), rng);
      items.push({
        itemId,
        skillId: skill.skillId,
        kind: rendered.kind,
        prompt: rendered.prompt,
        code: rendered.code,
        choices: rendered.choices,
        seconds: secondsByKind[rendered.kind],
      });
      secretItems.push({
        itemId,
        skillId: skill.skillId,
        templateId: template.id,
        topic: template.topic,
        difficulty: template.difficulty,
        kind: rendered.kind,
        correct: rendered.correct,
        value: rendered.value,
      });
    }
    sections.push({
      skillId: skill.skillId,
      slug: skill.slug,
      count: chosen.length,
    });
  }

  if (items.length === 0) {
    throw new EmptyAttemptError();
  }

  return {
    sections,
    items,
    secret: { grade: input.grade, items: secretItems },
  };
}

export function checkAnswer(
  item: SecretItem,
  answer: AttemptAnswer | undefined,
): boolean {
  if (!answer) {
    return false;
  }
  if (item.kind === "numeric") {
    return (
      answer.value !== null &&
      Math.abs(answer.value - (item.value ?? NaN)) < 1e-9
    );
  }
  if (item.kind === "multiple") {
    return sameList(
      ascending([...new Set(answer.choices)]),
      ascending(item.correct),
    );
  }
  return sameList(answer.choices, item.correct);
}

export function gradeAttempt(
  secret: AttemptSecret,
  answers: AttemptAnswer[],
): AttemptGrade {
  if (secret.items.length === 0) {
    throw new EmptyAttemptError();
  }
  const byItem = new Map<string, AttemptAnswer>();
  for (const answer of answers) {
    if (!byItem.has(answer.itemId)) {
      byItem.set(answer.itemId, answer);
    }
  }

  const items: ItemOutcome[] = [];
  const tally = new Map<string, { correct: number; total: number }>();
  for (const item of secret.items) {
    const correct = checkAnswer(item, byItem.get(item.itemId));
    items.push({ itemId: item.itemId, templateId: item.templateId, correct });
    const current = tally.get(item.skillId) ?? { correct: 0, total: 0 };
    current.total += 1;
    current.correct += correct ? 1 : 0;
    tally.set(item.skillId, current);
  }

  const sections = [...tally.entries()].map(([skillId, count]) => {
    const score = Math.round((count.correct / count.total) * 100);
    return { skillId, score, passed: score >= sectionPassScore };
  });
  const mean =
    sections.reduce((sum, section) => {
      return sum + section.score;
    }, 0) / sections.length;
  const score = Math.round(mean);
  const floorHeld = sections.every((section) => {
    return section.score >= sectionFloorScore;
  });

  return {
    passed: score >= attemptPassScore && floorHeld,
    score,
    grade: secret.grade,
    sections,
    items,
  };
}

// Сначала по одному заданию на тему, потом добор из оставшихся.
function chooseTemplates(
  rng: Rng,
  pool: Template[],
  count: number,
): Template[] {
  const shuffled = shuffle(rng, pool);
  const chosen: Template[] = [];
  const topics = new Set<string>();
  for (const template of shuffled) {
    if (chosen.length < count && !topics.has(template.topic)) {
      chosen.push(template);
      topics.add(template.topic);
    }
  }
  for (const template of shuffled) {
    if (chosen.length < count && !chosen.includes(template)) {
      chosen.push(template);
    }
  }
  return chosen;
}

type Rendered = {
  kind: ItemKind;
  prompt: string;
  code: string | null;
  choices: string[];
  correct: number[];
  value: number | null;
};

function render(task: Task, rng: Rng): Rendered {
  if (task.kind === "numeric") {
    return {
      kind: "numeric",
      prompt: task.prompt,
      code: task.code ?? null,
      choices: [],
      correct: [],
      value: task.answer,
    };
  }
  if (task.kind === "order") {
    let shown = shuffle(rng, task.steps);
    // Шаги уже по порядку — это подсказка, перемешиваем ещё раз.
    for (let tries = 0; tries < 5 && sameList(shown, task.steps); tries += 1) {
      shown = shuffle(rng, task.steps);
    }
    return {
      kind: "order",
      prompt: task.prompt,
      code: null,
      choices: shown,
      correct: task.steps.map((step) => {
        return shown.indexOf(step);
      }),
      value: null,
    };
  }
  if (task.kind === "multiple") {
    const choices = shuffle(rng, [...task.correct, ...task.wrong]);
    return {
      kind: "multiple",
      prompt: task.prompt,
      code: null,
      choices,
      correct: task.correct.map((item) => {
        return choices.indexOf(item);
      }),
      value: null,
    };
  }
  const choices = shuffle(rng, [task.correct, ...task.wrong]);
  return {
    kind: task.kind,
    prompt: task.prompt,
    code: task.kind === "code" ? task.code : null,
    choices,
    correct: [choices.indexOf(task.correct)],
    value: null,
  };
}

function uniqueSkills(skills: AttemptSkill[]): AttemptSkill[] {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    if (seen.has(skill.slug)) {
      return false;
    }
    seen.add(skill.slug);
    return true;
  });
}

function ascending(values: readonly number[]): number[] {
  return [...values].sort((left, right) => {
    return left - right;
  });
}

function sameList<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((item, index) => {
    return item === right[index];
  });
}
