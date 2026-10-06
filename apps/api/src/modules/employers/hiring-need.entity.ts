import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Grade, Specialization, WorkFormat } from "@hh/types";

// Потребность работодателя: кого ищет команда. По ней строится подборка.
@Entity("hiring_needs")
export class HiringNeed {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column()
  title!: string;

  @Column({
    type: "enum",
    enum: Specialization,
    enumName: "need_specialization",
  })
  specialization!: Specialization;

  @Column({ type: "enum", enum: Grade, enumName: "need_grade" })
  gradeFrom!: Grade;

  @Column({ type: "enum", enum: Grade, enumName: "need_grade" })
  gradeTo!: Grade;

  /** Навыки — названия как ввёл работодатель, а не id каталога: в потребности может быть любой стек. */
  @Column({ type: "text", array: true })
  mustSkills!: string[];

  @Column({ type: "text", array: true, default: "{}" })
  niceSkills!: string[];

  @Column({ type: "enum", enum: WorkFormat, enumName: "work_format" })
  workFormat!: WorkFormat;

  @Column({ type: "int" })
  salaryFrom!: number;

  @Column({ type: "int" })
  salaryTo!: number;

  @Column({ type: "text", default: "" })
  description!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
