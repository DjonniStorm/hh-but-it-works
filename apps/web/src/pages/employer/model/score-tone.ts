import { scoreColor } from "@/shared/theme";

export function scoreTone(score: number): string {
  if (score >= 75) {
    return scoreColor.strong;
  }
  if (score >= 50) {
    return scoreColor.medium;
  }
  return scoreColor.weak;
}
