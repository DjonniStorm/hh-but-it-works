import type { Grade } from "@hh/types";

import type { Rng } from "./random";

export type ItemKind = "single" | "multiple" | "numeric" | "code" | "order";

export type CodeLang =
  | "typescript"
  | "dockerfile"
  | "sql"
  | "python"
  | "csharp"
  | "go"
  | "java"
  | "tsx";

// Задание до перемешивания: верный ответ лежит отдельно от неверных.
export type Task =
  | { kind: "single"; prompt: string; correct: string; wrong: string[] }
  | {
      kind: "code";
      prompt: string;
      code: string;
      lang: CodeLang;
      correct: string;
      wrong: string[];
    }
  | {
      kind: "multiple";
      prompt: string;
      correct: string[];
      wrong: string[];
    }
  | {
      kind: "numeric";
      prompt: string;
      code?: string;
      lang?: CodeLang;
      answer: number;
    }
  | { kind: "order"; prompt: string; steps: string[] };

export type Template = {
  id: string;
  topic: string;
  grades: Grade[];
  // 1 — узнать факт, 2 — применить, 3 — разобрать ситуацию.
  difficulty: 1 | 2 | 3;
  build: (rng: Rng) => Task;
};

export type PublicItem = {
  itemId: string;
  skillId: string;
  kind: ItemKind;
  prompt: string;
  code: string | null;
  lang: CodeLang | null;
  choices: string[];
  seconds: number;
};

export type SecretItem = {
  itemId: string;
  skillId: string;
  templateId: string;
  topic: string;
  difficulty: 1 | 2 | 3;
  kind: ItemKind;
  // single и code — один индекс, multiple — набор, order — порядок показанных шагов.
  correct: number[];
  value: number | null;
};

export type AttemptAnswer = {
  itemId: string;
  choices: number[];
  value: number | null;
};
