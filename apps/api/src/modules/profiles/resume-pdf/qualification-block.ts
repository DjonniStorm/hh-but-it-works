import { heading, paragraph, progressBar, textStyle } from "./blocks";
import { baseline } from "./canvas";
import type { Column } from "./column";
import type { ResumeQualification } from "./resume-data";
import {
  gradeLabel,
  phrase,
  rhythm,
  sectionTitle,
  size,
  text,
  toneColors,
} from "./theme";

const textX = size.icon + rhythm.iconGap;

// Грейд записью в стиле Reactive Resume: иконка и грейд, статус, балл со шкалой, дата теста.
export function qualificationBlock(
  col: Column,
  value: ResumeQualification,
): void {
  heading(col, sectionTitle.qualification, rhythm.line * 3);
  const colors = toneColors[col.tone];
  const grade = gradeLabel[value.verified ?? value.claimed];
  col.reserve(rhythm.line);
  const iconTop = col.y - (rhythm.line - size.icon) / 2;
  const icon = value.verified ? "sealCheck" : "code";
  col.canvas.icon(col.index, icon, col.x, iconTop, size.icon, colors.icon);
  const y = baseline(col.y, rhythm.line, size.body);
  col.canvas.text(
    col.index,
    grade,
    col.x + textX,
    y,
    textStyle(col, "semibold"),
  );
  col.gap(rhythm.line);

  const plain = textStyle(col);
  paragraph(
    col,
    value.verified ? text.gradeVerified : text.gradeClaimed,
    plain,
  );
  if (value.verified && value.verified !== value.claimed) {
    paragraph(
      col,
      `${text.claimedPrefix}: ${gradeLabel[value.claimed]}`,
      plain,
    );
  }
  if (value.score !== null) {
    paragraph(col, `${text.score}: ${phrase.score(value.score)}`, plain);
    progressBar(col, value.score / 100);
  }
  if (value.verifiedAt) {
    const date = value.verifiedAt.toLocaleDateString("ru-RU");
    paragraph(col, `${text.testDate} ${date}`, plain);
  }
  col.gap(rhythm.section);
}
