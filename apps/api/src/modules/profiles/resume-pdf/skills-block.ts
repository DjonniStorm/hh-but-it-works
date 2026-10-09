import { leading, paragraph, pill, sectionTitle } from "./blocks";
import type { TextStyle } from "./canvas";
import type { Column } from "./column";
import { type ResumeSkill, SkillSource, skillSourceLabel } from "./resume-data";
import {
  levelLabel,
  levelRank,
  palette,
  size,
  text,
  sectionTitle as titles,
  toneColors,
} from "./theme";

const rowHeight = 17;
// Ширины колонок таблицы справа налево: дата, плашка, подпись уровня, точки.
const dateWidth = 36;
const pillWidth = 30;
const levelWidth = 58;
const dotsWidth = 22;
// Уже этой ширины подпись уровня не показываем, остаются точки.
const compactBelow = 260;

const sourceFill: Record<SkillSource, typeof palette.accent> = {
  [SkillSource.Test]: palette.accent,
  [SkillSource.Fsp]: palette.ink,
};

export function skillsBlock(col: Column, skills: ResumeSkill[]): void {
  sectionTitle(col, titles.skills);
  const colors = toneColors[col.tone];
  if (skills.length === 0) {
    paragraph(col, text.noSkills, {
      font: "regular",
      size: size.body,
      color: colors.muted,
    });
    col.gap(8);
    return;
  }
  const verified = skills.filter((skill) => {
    return skill.source;
  });
  const claimed = skills.filter((skill) => {
    return !skill.source;
  });
  if (verified.length > 0) {
    group(col, `${text.verifiedSkills} · ${verified.length}`, verified);
    paragraph(col, text.skillLegend, {
      font: "regular",
      size: size.tiny,
      color: palette.faint,
    });
    col.gap(8);
  }
  if (claimed.length > 0) {
    group(col, `${text.claimedSkills} · ${claimed.length}`, claimed);
  }
  col.gap(8);
}

function group(col: Column, title: string, skills: ResumeSkill[]): void {
  const colors = toneColors[col.tone];
  col.reserve(14 + rowHeight);
  col.canvas.text(col.index, title, col.x, col.y - size.small, {
    font: "semibold",
    size: size.small,
    color: colors.muted,
  });
  col.gap(leading(size.small) + 2);
  for (const skill of skills) {
    row(col, skill);
  }
  col.gap(4);
}

function row(col: Column, skill: ResumeSkill): void {
  const { canvas } = col;
  const colors = toneColors[col.tone];
  col.reserve(rowHeight);
  const baseline = col.y - 11;
  const centerY = baseline + 3;
  const compact = col.width < compactBelow;
  let right = col.x + col.width;

  // Справа налево: дата и плашка источника есть только у подтверждённых.
  right -= dateWidth;
  if (skill.source && skill.verifiedAt) {
    const date: TextStyle = {
      font: "mono",
      size: size.tiny,
      color: palette.faint,
    };
    const shown = skill.verifiedAt.toLocaleDateString("ru-RU", {
      month: "2-digit",
      year: "numeric",
    });
    canvas.text(
      col.index,
      shown,
      right + dateWidth - canvas.width(shown, date),
      baseline,
      date,
    );
  }
  right -= pillWidth;
  if (skill.source) {
    pill(
      canvas,
      col.index,
      right + 2,
      centerY,
      skillSourceLabel[skill.source],
      sourceFill[skill.source],
      palette.white,
    );
  }
  if (!compact) {
    right -= levelWidth;
    canvas.text(col.index, levelLabel[skill.level], right + 6, baseline, {
      font: "regular",
      size: size.small,
      color: colors.muted,
    });
  }
  right -= dotsWidth;
  for (let dot = 0; dot < 3; dot += 1) {
    canvas.page(col.index).drawCircle({
      x: right + 3 + dot * 7,
      y: centerY,
      size: 2.4,
      color: dot < levelRank[skill.level] ? palette.accent : palette.dotOff,
    });
  }

  const title: TextStyle = {
    font: "regular",
    size: size.body,
    color: colors.text,
  };
  // Длинное название обрезаем, чтобы таблица не ломалась.
  canvas.text(
    col.index,
    canvas.clip(skill.title, title, right - col.x - 8),
    col.x,
    baseline,
    title,
  );
  canvas.rect(
    col.index,
    col.x,
    col.y - rowHeight + 0.5,
    col.width,
    0.4,
    colors.rule,
  );
  col.gap(rowHeight);
}
