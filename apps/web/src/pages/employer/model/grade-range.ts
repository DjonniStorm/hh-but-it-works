import { gradeLabel } from "@/shared/lib/labels";

import type { Grade } from "@hh/types";

export function formatGradeRange(from: Grade, to: Grade): string {
  if (from === to) {
    return gradeLabel[from];
  }
  return `${gradeLabel[from]} – ${gradeLabel[to]}`;
}
