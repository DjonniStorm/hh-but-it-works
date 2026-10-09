import { entriesBlock, factsBlock, paragraph, sectionTitle } from "./blocks";
import type { Column } from "./column";
import { qualificationBlock } from "./qualification-block";
import type { ResumeData } from "./resume-data";
import { skillsBlock } from "./skills-block";
import { size, sectionTitle as titles, toneColors } from "./theme";

// Узкая колонка у всех трёх раскладок: грейд и ожидания.
export function sidebarSections(col: Column, data: ResumeData): void {
  sectionTitle(col, titles.qualification, 48);
  qualificationBlock(col, data.qualification);
  if (data.facts.length > 0) {
    sectionTitle(col, titles.preferences);
    factsBlock(col, data.facts);
  }
}

// Основная колонка. Опыт и образование стоят выше навыков, как в обычном резюме.
export function mainSections(
  col: Column,
  data: ResumeData,
  withSummary: boolean,
): void {
  if (withSummary) {
    sectionTitle(col, titles.summary);
    summary(col, data.summary);
    col.gap(10);
  }
  entriesBlock(col, titles.experience, data.experience);
  entriesBlock(col, titles.education, data.education);
  skillsBlock(col, data.skills);
  entriesBlock(col, titles.achievements, data.achievements);
}

export function summary(col: Column, value: string): void {
  paragraph(col, value, {
    font: "regular",
    size: size.body,
    color: toneColors[col.tone].text,
  });
}
