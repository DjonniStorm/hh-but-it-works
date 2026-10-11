import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type { RichTextDoc } from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

export const oneActiveIndex = "invitations_one_open";

// Приглашение работодателя кандидату. Статус меняет кандидат (принять, отклонить)
// или работодатель (отозвать, пока нет ответа).
// Одно открытое приглашение от компании кандидату держит база.
// Отказ и отзыв выпадают из индекса, можно пригласить снова.
// synchronize не сравнивает where у индекса: новое условие — только под новым именем.
@Index(oneActiveIndex, ["userId", "candidateProfileId"], {
  unique: true,
  where: `"status" IN ('sent'::"invitation_status", 'viewed'::"invitation_status", 'accepted'::"invitation_status")`,
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

  @Column({ type: "jsonb" })
  message!: RichTextDoc;

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
