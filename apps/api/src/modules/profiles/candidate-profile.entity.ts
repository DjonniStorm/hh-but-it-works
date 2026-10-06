import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Grade, Specialization } from "@hh/types";

@Entity("candidate_profiles")
export class CandidateProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @Column()
  displayName!: string;

  @Column({
    type: "enum",
    enum: Specialization,
    enumName: "candidate_specialization",
  })
  specialization!: Specialization;

  @Column({ type: "enum", enum: Grade, enumName: "claimed_grade" })
  claimedGrade!: Grade;

  @Column({ type: "varchar", nullable: true })
  fspId!: string | null;

  /** Ссылки агрегатора. Пустая строка с клиента хранится как null. */
  @Column({ type: "varchar", length: 120, nullable: true })
  telegram!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  github!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  linkedin!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  website!: string | null;

  /** На биржу выводит подтверждение, не сохранение анкеты. */
  @Column({ default: false })
  listed!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
