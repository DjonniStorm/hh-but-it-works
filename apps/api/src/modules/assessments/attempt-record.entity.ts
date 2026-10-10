import { Column, Entity, Index, PrimaryColumn } from "typeorm";

import { AttemptStatus, Grade, IntegrityFlag, Specialization } from "@hh/types";

/** Завершённая попытка. Активная живёт в Redis, сюда попадает итог. */
@Entity("assessment_attempts")
export class AttemptRecord {
  /** Тот же id, что у попытки в Redis. */
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: Grade, enumName: "attempt_grade" })
  grade!: Grade;

  /**
   * Специализация из анкеты на момент попытки: вместе с грейдом это история
   * опроса. У попыток до этой колонки — null. Свой тип enum, как у остальных
   * колонок с enum: общий synchronize не сможет удалить.
   */
  @Column({
    type: "enum",
    enum: Specialization,
    enumName: "attempt_specialization",
    nullable: true,
  })
  specialization!: Specialization | null;

  @Column({ type: "enum", enum: AttemptStatus, enumName: "attempt_status" })
  status!: AttemptStatus;

  @Column({ type: "int" })
  score!: number;

  @Column({ type: "int" })
  integrity!: number;

  @Column({ type: "jsonb" })
  sections!: {
    skillId: string;
    title: string;
    score: number;
    passed: boolean;
  }[];

  @Column({ type: "jsonb" })
  flags!: { type: IntegrityFlag; count: number }[];

  @Column({ default: false })
  gradeChanged!: boolean;

  @Column({ type: "timestamptz" })
  startedAt!: Date;

  @Column({ type: "timestamptz" })
  finishedAt!: Date;
}
