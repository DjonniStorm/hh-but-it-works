import { paragraph, pill } from "./blocks";
import type { TextStyle } from "./canvas";
import type { Column } from "./column";
import type { ResumeQualification } from "./resume-data";
import { gradeLabel, palette, size, text, toneColors } from "./theme";

export function qualificationBlock(col: Column, value: ResumeQualification) {
  const colors = toneColors[col.tone];
  const grade = gradeLabel[value.verified ?? value.claimed];
  const gradeStyle: TextStyle = {
    font: "bold",
    size: size.grade,
    color: colors.text,
  };
  col.reserve(40);
  col.canvas.text(col.index, grade, col.x, col.y - size.grade, gradeStyle);
  const pillX = col.x + col.canvas.width(grade, gradeStyle) + 8;
  const pillY = col.y - size.grade * 0.62;
  if (value.verified) {
    pill(
      col.canvas,
      col.index,
      pillX,
      pillY,
      text.gradeVerified,
      palette.accent,
      palette.white,
    );
  } else {
    pill(
      col.canvas,
      col.index,
      pillX,
      pillY,
      text.gradeClaimed,
      colors.rule,
      colors.text,
    );
  }
  col.gap(size.grade + 8);
  if (value.verified && value.verified !== value.claimed) {
    paragraph(col, `${text.claimedPrefix}: ${gradeLabel[value.claimed]}`, {
      font: "regular",
      size: size.small,
      color: colors.muted,
    });
    col.gap(4);
  }
  if (value.score !== null) {
    scoreBar(col, value.score);
  }
  if (value.verifiedAt) {
    paragraph(
      col,
      `${text.testDate} ${value.verifiedAt.toLocaleDateString("ru-RU")}`,
      { font: "regular", size: size.small, color: colors.muted },
    );
  }
  col.gap(10);
}

function scoreBar(col: Column, score: number): void {
  const colors = toneColors[col.tone];
  const label: TextStyle = {
    font: "semibold",
    size: size.tiny,
    color: colors.muted,
    tracking: 0.6,
  };
  const number: TextStyle = {
    font: "mono",
    size: size.small,
    color: colors.text,
  };
  const shown = `${score}/100`;
  col.reserve(26);
  col.canvas.text(
    col.index,
    text.score.toUpperCase(),
    col.x,
    col.y - size.small,
    label,
  );
  const numberX = col.x + col.width - col.canvas.width(shown, number);
  col.canvas.text(col.index, shown, numberX, col.y - size.small, number);
  const barY = col.y - size.small - 9;
  const share = Math.min(Math.max(score, 0), 100) / 100;
  col.canvas.rect(col.index, col.x, barY, col.width, 3.5, colors.rule);
  col.canvas.rect(
    col.index,
    col.x,
    barY,
    col.width * share,
    3.5,
    palette.accent,
  );
  col.gap(size.small + 17);
}
