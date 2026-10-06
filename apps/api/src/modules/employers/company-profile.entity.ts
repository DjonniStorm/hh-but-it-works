import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Профиль компании. Один на пользователя-работодателя.
@Entity("company_profiles")
export class CompanyProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @Column()
  name!: string;

  @Column()
  industry!: string;

  @Column({ type: "text" })
  description!: string;

  /** Пустая строка, если сайта нет: так же приходит из формы. */
  @Column({ default: "" })
  website!: string;

  @Column()
  contactEmail!: string;

  @Column({ default: "" })
  contactTelegram!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
