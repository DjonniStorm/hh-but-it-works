import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

import { SkillLevel, SkillVerification } from "@hh/types";

@Entity("candidate_skills")
@Unique("candidate_skill_once", ["profileId", "skillId"])
export class CandidateSkill {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  profileId!: string;

  @Column({ type: "uuid" })
  skillId!: string;

  @Column({ type: "enum", enum: SkillLevel, enumName: "skill_level" })
  level!: SkillLevel;

  /** Самооценка не подтверждает навык. Статус с клиента не принимаем. */
  @Column({
    type: "enum",
    enum: SkillVerification,
    enumName: "skill_verification",
    default: SkillVerification.Unverified,
  })
  verification!: SkillVerification;

  /** Балл теста. Пустой, пока эта попытка навык не подтвердила. */
  @Column({ type: "int", nullable: true })
  score!: number | null;
}
