import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { InvitationStatus } from "@hh/types";

export const oneActiveIndex = "invitations_one_active";

// Приглашение работодателя кандидату. Статус меняет кандидат (принять, отклонить).
// Одно активное приглашение от компании кандидату держит база: параллельные запросы
// не создадут второе. После отказа строка выпадает из индекса, можно пригласить снова.
// synchronize не сравнивает where у индекса: новое условие — только под новым именем.
@Index(oneActiveIndex, ["userId", "candidateProfileId"], {
  unique: true,
  where: `"status" <> 'declined'`,
})
@Entity("invitations")
export class Invitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Пользователь-работодатель, который пригласил. */
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Index()
  @Column({ type: "uuid" })
  candidateProfileId!: string;

  /** Без привязки к потребности тоже можно (ТЗ 2.1). */
  @Column({ type: "uuid", nullable: true })
  needId!: string | null;

  @Column({ type: "text" })
  message!: string;

  @Column()
  contact!: string;

  @Column({ type: "int" })
  salaryFrom!: number;

  @Column({ type: "int" })
  salaryTo!: number;

  @Column({
    type: "enum",
    enum: InvitationStatus,
    enumName: "invitation_status",
    default: InvitationStatus.Sent,
  })
  status!: InvitationStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
