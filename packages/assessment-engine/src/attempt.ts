import { Grade } from "@hh/types";

import { type Stem, isCatalogSlug, templates } from "./templates";

export const passRatio = 0.7;

export type AttemptSkill = {
  skillId: string;
  slug: string;
};

export type BuildAttemptInput = {
  grade: Grade;
  skills: AttemptSkill[];
  seed: number;
};

export type PublicItem = {
  itemId: string;
  skillId: string;
  prompt: string;
  choices: string[];
};

export type SecretItem = {
  itemId: string;
  skillId: string;
  correctIndex: number;
};

export type AttemptSecret = {
  grade: Grade;
  items: SecretItem[];
};

export type BuiltAttempt = {
  items: PublicItem[];
  secret: AttemptSecret;
};

export type AttemptAnswer = {
  itemId: string;
  choice: number;
};

export type SkillScore = {
  skillId: string;
  score: number;
};

export type AttemptGrade = {
  passed: boolean;
  score: number;
  grade: Grade;
  skills: SkillScore[];
};

export class EmptyAttemptError extends Error {
  constructor() {
    super("Empty attempt");
    this.name = "EmptyAttemptError";
  }
}

export function buildAttempt(input: BuildAttemptInput): BuiltAttempt {
  const skills = [...input.skills].sort((left, right) => {
    return left.slug.localeCompare(right.slug);
  });
  const items: PublicItem[] = [];
  const secretItems: SecretItem[] = [];

  for (const skill of skills) {
    if (!isCatalogSlug(skill.slug)) {
      continue;
    }
    const template = templates[skill.slug][input.grade];
    const rng = mulberry32(mixSeed(input.seed, skill.slug));
    const rendered = withChoices(template(rng), rng);
    const itemId = `item-${items.length}`;
    items.push({
      itemId,
      skillId: skill.skillId,
      prompt: rendered.prompt,
      choices: rendered.choices,
    });
    secretItems.push({
      itemId,
      skillId: skill.skillId,
      correctIndex: rendered.correctIndex,
    });
  }

  if (items.length === 0) {
    throw new EmptyAttemptError();
  }

  return {
    items,
    secret: { grade: input.grade, items: secretItems },
  };
}

export function gradeAttempt(
  secret: AttemptSecret,
  answers: AttemptAnswer[],
): AttemptGrade {
  if (secret.items.length === 0) {
    throw new EmptyAttemptError();
  }
  const byItem = new Map<string, number>();
  for (const answer of answers) {
    if (!byItem.has(answer.itemId)) {
      byItem.set(answer.itemId, answer.choice);
    }
  }

  let correct = 0;
  const skills: SkillScore[] = [];
  for (const item of secret.items) {
    const choice = byItem.get(item.itemId);
    const hit = choice === item.correctIndex;
    if (hit) {
      correct += 1;
    }
    skills.push({ skillId: item.skillId, score: hit ? 100 : 0 });
  }

  const ratio = correct / secret.items.length;
  return {
    passed: ratio >= passRatio,
    score: Math.round(ratio * 100),
    grade: secret.grade,
    skills,
  };
}

function withChoices(
  stem: Stem,
  rng: () => number,
): { prompt: string; choices: string[]; correctIndex: number } {
  const choices = [stem.correct, ...stem.wrong];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = choices[index] ?? stem.correct;
    choices[index] = choices[swapIndex] ?? stem.correct;
    choices[swapIndex] = current;
  }
  const correctIndex = choices.indexOf(stem.correct);
  return { prompt: stem.prompt, choices, correctIndex };
}

function mixSeed(seed: number, slug: string): number {
  let hash = seed >>> 0;
  for (const char of slug) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x5bd1e995);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
