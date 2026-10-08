import { Grade } from "@hh/types";

import type { CodeLang, Template } from "../types";

export const { Junior, Middle, Senior } = Grade;

type Band = {
  id: string;
  topic: string;
  grades: Grade[];
  difficulty: 1 | 2 | 3;
};

function shell(band: Band, build: Template["build"]): Template {
  return { ...band, build };
}

export function single(
  band: Band,
  prompt: string,
  correct: string,
  wrong: string[],
): Template {
  return shell(band, () => {
    return { kind: "single", prompt, correct, wrong };
  });
}

export function code(
  band: Band,
  lang: CodeLang,
  prompt: string,
  source: string,
  correct: string,
  wrong: string[],
): Template {
  return shell(band, () => {
    return { kind: "code", lang, prompt, code: source, correct, wrong };
  });
}

export function numeric(
  band: Band,
  prompt: string,
  answer: number,
  source?: { lang: CodeLang; code: string },
): Template {
  return shell(band, () => {
    return {
      kind: "numeric",
      prompt,
      answer,
      code: source?.code,
      lang: source?.lang,
    };
  });
}

export function multi(
  band: Band,
  prompt: string,
  correct: string[],
  wrong: string[],
): Template {
  return shell(band, () => {
    return { kind: "multiple", prompt, correct, wrong };
  });
}

export function order(band: Band, prompt: string, steps: string[]): Template {
  return shell(band, () => {
    return { kind: "order", prompt, steps };
  });
}
