import { Entity, PrimaryColumn } from "typeorm";

// «Не подходит» в подборке: кандидат скрыт только в этой потребности.
@Entity("need_dismissals")
export class NeedDismissal {
  @PrimaryColumn({ type: "uuid" })
  needId!: string;

  @PrimaryColumn({ type: "uuid" })
  candidateProfileId!: string;
}
