import { entries, facts, heading, paragraph, textStyle } from "./blocks";
import { baseline } from "./canvas";
import type { Column } from "./column";
import {
  type ResumeContact,
  contactIcon,
  contactLabel,
  profileKinds,
} from "./contacts";
import { qualificationBlock } from "./qualification-block";
import type { ResumeData } from "./resume-data";
import { skillsBlock } from "./skills-block";
import { rhythm, size, sectionTitle as titles, toneColors } from "./theme";

const profileColumns = 2;
const profileGap = 12;
const textX = size.icon + rhythm.iconGap;

// Контакты для шапки: всё, кроме профилей соцсетей.
export function headerContacts(data: ResumeData): ResumeContact[] {
  return data.contacts.filter((contact) => {
    return !profileKinds.has(contact.kind);
  });
}

// Боковая колонка у всех трёх раскладок: грейд, ожидания, достижения ФСП.
export function sidebarSections(col: Column, data: ResumeData): void {
  qualificationBlock(col, data.qualification);
  if (data.facts.length > 0) {
    heading(col, titles.preferences);
    facts(col, data.facts);
    col.gap(rhythm.section);
  }
  entries(col, titles.achievements, data.achievements);
}

// Основная колонка в порядке Reactive Resume: ссылки, сводка, навыки, опыт, образование.
export function mainSections(
  col: Column,
  data: ResumeData,
  withSummary: boolean,
): void {
  profilesBlock(
    col,
    data.contacts.filter((contact) => {
      return profileKinds.has(contact.kind);
    }),
  );
  if (withSummary) {
    heading(col, titles.summary);
    summary(col, data.summary);
    col.gap(rhythm.section);
  }
  skillsBlock(col, data.skills);
  entries(col, titles.experience, data.experience);
  entries(col, titles.education, data.education);
}

export function summary(col: Column, value: string): void {
  paragraph(col, value, textStyle(col));
}

// «Ссылки»: профили сеткой, как «Online Presence» — иконка и сеть, ниже ник.
function profilesBlock(col: Column, profiles: ResumeContact[]): void {
  if (profiles.length === 0) {
    return;
  }
  const itemHeight = rhythm.line * 2;
  heading(col, titles.profiles, itemHeight);
  const width =
    (col.width - profileGap * (profileColumns - 1)) / profileColumns;
  const colors = toneColors[col.tone];
  for (let start = 0; start < profiles.length; start += profileColumns) {
    col.reserve(itemHeight);
    profiles.slice(start, start + profileColumns).forEach((profile, slot) => {
      const x = col.x + slot * (width + profileGap);
      const iconTop = col.y - (rhythm.line - size.icon) / 2;
      const icon = contactIcon[profile.kind];
      col.canvas.icon(col.index, icon, x, iconTop, size.icon, colors.icon);
      const strong = textStyle(col, "semibold");
      const titleY = baseline(col.y, rhythm.line, size.body);
      const label = contactLabel[profile.kind];
      col.canvas.text(col.index, label, x + textX, titleY, strong);
      const plain = textStyle(col);
      const shown = col.canvas.clip(profile.value, plain, width);
      const valueTop = col.y - rhythm.line;
      const valueY = baseline(valueTop, rhythm.line, size.body);
      col.canvas.text(col.index, shown, x, valueY, plain);
      const valueWidth = col.canvas.width(shown, plain);
      col.canvas.link(
        col.index,
        x,
        valueTop - rhythm.line,
        valueWidth,
        rhythm.line,
        profile.url,
      );
    });
    col.gap(itemHeight + 4);
  }
  col.gap(rhythm.section);
}
