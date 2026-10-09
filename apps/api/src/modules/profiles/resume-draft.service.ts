import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

import type { ResumeDraft } from "@hh/contracts";

import { draftFromText } from "./resume-draft";
import { assertPdf, textOfPdf } from "./resume-text";
import { Skill } from "./skill.entity";

@Injectable()
export class ResumeDraftService {
  constructor(
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
  ) {}

  async draftFrom(file: Express.Multer.File | undefined): Promise<ResumeDraft> {
    const text = await textOfPdf(assertPdf(file));
    // Весь каталог из БД: новые навыки распознаются без правки словаря.
    const catalog = await this.skills.find({
      select: { slug: true, title: true },
    });
    const draft = draftFromText(text, catalog);
    if (!draft) {
      throw new UnprocessableEntityException("В файле нет текста");
    }
    return draft;
  }
}
