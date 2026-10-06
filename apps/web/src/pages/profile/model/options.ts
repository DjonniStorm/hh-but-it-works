import { Grade, SkillLevel, Specialization } from "@hh/types";

export const specializationOptions = [
  { value: Specialization.Backend, label: "Бэкенд" },
  { value: Specialization.Frontend, label: "Фронтенд" },
  { value: Specialization.Data, label: "Данные" },
  { value: Specialization.Security, label: "Информационная безопасность" },
];

export const gradeOptions = [
  { value: Grade.Junior, label: "Junior" },
  { value: Grade.Middle, label: "Middle" },
  { value: Grade.Senior, label: "Senior" },
];

export const skillLevelOptions = [
  { value: SkillLevel.Basic, label: "Базовый" },
  { value: SkillLevel.Confident, label: "Уверенный" },
  { value: SkillLevel.Strong, label: "Сильный" },
];
