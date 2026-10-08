import { IntegrityFlag } from "@hh/types";

export type FlagCount = {
  type: IntegrityFlag;
  count: number;
};

const flagOrder = Object.values(IntegrityFlag);

// Сколько баллов чистоты снимает одно событие.
export const flagPenalty: Record<IntegrityFlag, number> = {
  [IntegrityFlag.TabHidden]: 15,
  [IntegrityFlag.WindowBlur]: 10,
  [IntegrityFlag.FullscreenExit]: 15,
  [IntegrityFlag.FullscreenDenied]: 10,
  [IntegrityFlag.Copy]: 10,
  [IntegrityFlag.IpChange]: 25,
  [IntegrityFlag.AgentChange]: 40,
  [IntegrityFlag.FastAnswer]: 10,
};

export const annulBelow = 40;

// Быстрее этого вопрос не прочитать: ответ похож на подсказку со стороны.
export const fastAnswerMs = 3000;

export function isIntegrityFlag(value: unknown): value is IntegrityFlag {
  return flagOrder.includes(value as IntegrityFlag);
}

export function countFlags(flags: IntegrityFlag[]): FlagCount[] {
  const counts = new Map<IntegrityFlag, number>();
  for (const flag of flags) {
    counts.set(flag, (counts.get(flag) ?? 0) + 1);
  }
  return flagOrder.flatMap((type) => {
    const count = counts.get(type);
    return count ? [{ type, count }] : [];
  });
}

export function integrityScore(flags: IntegrityFlag[]): number {
  const penalty = flags.reduce((sum, flag) => {
    return sum + flagPenalty[flag];
  }, 0);
  return Math.max(0, 100 - penalty);
}

export function isAnnulled(integrity: number): boolean {
  return integrity < annulBelow;
}
