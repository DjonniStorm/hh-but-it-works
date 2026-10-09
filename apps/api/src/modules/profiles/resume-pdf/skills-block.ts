import {
  heading,
  levelBar,
  levelBarHeight,
  paragraph,
  textStyle,
} from "./blocks";
import { baseline } from "./canvas";
import type { Column } from "./column";
import type { IconName } from "./icons";
import { type ResumeSkill, SkillSource } from "./resume-data";
import {
  levelLabel,
  levelRank,
  levelSteps,
  rhythm,
  sectionTitle,
  size,
  text,
  toneColors,
} from "./theme";

const columnGap = 12;
const textX = size.icon + rhythm.iconGap;
const itemHeight = rhythm.line * 2 + rhythm.smallLine + 3 + levelBarHeight;

const sourceIcon: Record<SkillSource, IconName> = {
  [SkillSource.Test]: "sealCheck",
  [SkillSource.Fsp]: "medal",
};

const sourceCaption: Record<SkillSource, string> = {
  [SkillSource.Test]: "Подтверждён тестом",
  [SkillSource.Fsp]: "Подтверждён ФСП",
};

const claimedCaption = "Заявлен кандидатом";

// Навыки сеткой в две колонки, как «Technical Skills» у Reactive Resume:
// иконка и название, уровень, источник подтверждения и шкала из трёх делений.
export function skillsBlock(col: Column, skills: ResumeSkill[]): void {
  heading(col, sectionTitle.skills, itemHeight);
  if (skills.length === 0) {
    paragraph(col, text.noSkills, textStyle(col));
    col.gap(rhythm.section);
    return;
  }
  const width = (col.width - columnGap) / 2;
  for (let start = 0; start < skills.length; start += 2) {
    if (start > 0) {
      col.gap(rhythm.item + 2);
    }
    col.reserve(itemHeight);
    skillItem(col, skills[start], col.x, width);
    if (skills[start + 1]) {
      skillItem(col, skills[start + 1], col.x + width + columnGap, width);
    }
    col.gap(itemHeight);
  }
  col.gap(rhythm.section);
}

function skillItem(
  col: Column,
  skill: ResumeSkill,
  x: number,
  width: number,
): void {
  const { canvas } = col;
  const colors = toneColors[col.tone];
  let top = col.y;
  const icon = skill.source ? sourceIcon[skill.source] : "code";
  const iconTop = top - (rhythm.line - size.icon) / 2;
  canvas.icon(col.index, icon, x, iconTop, size.icon, colors.icon);
  const strong = textStyle(col, "semibold");
  const name = canvas.clip(skill.title, strong, width - textX);
  const nameY = baseline(top, rhythm.line, size.body);
  canvas.text(col.index, name, x + textX, nameY, strong);
  top -= rhythm.line;

  const levelY = baseline(top, rhythm.line, size.body);
  canvas.text(col.index, levelLabel[skill.level], x, levelY, textStyle(col));
  top -= rhythm.line;

  const small = textStyle(col, "regular", size.small);
  const smallY = baseline(top, rhythm.smallLine, size.small);
  canvas.text(
    col.index,
    canvas.clip(caption(skill), small, width),
    x,
    smallY,
    small,
  );
  top -= rhythm.smallLine + 3;

  const filled = levelRank[skill.level];
  levelBar(canvas, col.index, x, top, width, filled, levelSteps);
}

function caption(skill: ResumeSkill): string {
  if (!skill.source) {
    return claimedCaption;
  }
  if (!skill.verifiedAt) {
    return sourceCaption[skill.source];
  }
  const date = skill.verifiedAt.toLocaleDateString("ru-RU", {
    month: "2-digit",
    year: "numeric",
  });
  return `${sourceCaption[skill.source]} · ${date}`;
}
