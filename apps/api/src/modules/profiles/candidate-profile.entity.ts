import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Grade, SearchStatus, Specialization, WorkFormat } from "@hh/types";

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

  /** Ожидания кандидата. По ним подборка сверяет вилку и формат работодателя. */
  @Column({ type: "int", nullable: true })
  desiredSalaryFrom!: number | null;

  @Column({ type: "text", array: true, default: "{}" })
  workFormats!: WorkFormat[];

  @Column({
    type: "enum",
    enum: SearchStatus,
    enumName: "search_status",
    default: SearchStatus.OpenToOffers,
  })
  searchStatus!: SearchStatus;

  /**
   * Итоги тестирования для карточки в подборке. Пишет их будущий модуль теста,
   * пока заполнены только у сид-кандидатов. Из формы профиля не приходят.
   */
  @Column({
    type: "enum",
    enum: Grade,
    enumName: "verified_grade",
    nullable: true,
  })
  verifiedGrade!: Grade | null;

  @Column({ type: "int", nullable: true })
  assessmentScore!: number | null;

  /** Когда подтвердили грейд. От этой даты считается пауза перед сменой. */
  @Column({ type: "timestamptz", nullable: true })
  verifiedAt!: Date | null;

  /**
   * Последний грейд, на который сменилось подтверждение, и когда. От них считается пауза.
   * Смена специализации их не сбрасывает, в отличие от verifiedGrade и verifiedAt.
   */
  @Column({
    type: "enum",
    enum: Grade,
    enumName: "verified_grade",
    nullable: true,
  })
  cooldownGrade!: Grade | null;

  @Column({ type: "timestamptz", nullable: true })
  cooldownFrom!: Date | null;

  @Column({ type: "real", nullable: true })
  experienceYears!: number | null;

  /** На биржу выводит подтверждение, не сохранение анкеты. */
  @Column({ default: false })
  listed!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
