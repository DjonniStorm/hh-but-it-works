import { ResumeTemplate } from "@hh/types";

// Порядок пунктов в меню. Первый — шаблон по умолчанию на сервере.
export const resumeTemplateOptions: {
  value: ResumeTemplate;
  label: string;
  description: string;
}[] = [
  {
    value: ResumeTemplate.Ditto,
    label: "Ditto",
    description: "Графитовая шапка, две колонки",
  },
  {
    value: ResumeTemplate.Gengar,
    label: "Gengar",
    description: "Тёмная боковая панель с контактами",
  },
  {
    value: ResumeTemplate.Pikachu,
    label: "Pikachu",
    description: "Крупные инициалы и карточка с именем",
  },
];
