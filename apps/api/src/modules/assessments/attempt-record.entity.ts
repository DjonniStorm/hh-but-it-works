import { Column, Entity, Index, PrimaryColumn } from "typeorm";

import { AttemptStatus, Grade, IntegrityFlag } from "@hh/types";

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
