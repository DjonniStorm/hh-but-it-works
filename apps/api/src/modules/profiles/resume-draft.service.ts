import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import type { ResumeDraft } from "@hh/contracts";

import { draftFromText } from "./resume-draft";
import { assertPdf, textOfPdf } from "./resume-text";

@Injectable()
export class ResumeDraftService {
  async draftFrom(file: Express.Multer.File | undefined): Promise<ResumeDraft> {
    const text = await textOfPdf(assertPdf(file));
    const draft = draftFromText(text);
    if (!draft) {
      throw new UnprocessableEntityException("В файле нет текста");
    }
    return draft;
  }
}
