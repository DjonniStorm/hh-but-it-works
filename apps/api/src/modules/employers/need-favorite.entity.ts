import { Entity, PrimaryColumn } from "typeorm";

// Избранное по потребности. Фильтры подборки эту отметку не снимают.
@Entity("need_favorites")
export class NeedFavorite {
  @PrimaryColumn({ type: "uuid" })
  needId!: string;

  @PrimaryColumn({ type: "uuid" })
  candidateProfileId!: string;
}
