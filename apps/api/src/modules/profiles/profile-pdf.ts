import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable, NotFoundException, StreamableFile } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";

import type { ResumeTemplate } from "@hh/types";

import { FspClient } from "../../common/fsp/fsp.client";
import { UsersService } from "../users/users.service";
import { CandidateProfile } from "./candidate-profile.entity";
import { CandidateSkill } from "./candidate-skill.entity";
import { type FontFiles, renderResume } from "./resume-pdf/render";
import { buildResume } from "./resume-pdf/resume-data";
import { Skill } from "./skill.entity";

// Nest копирует src/assets в dist/assets. От dist/modules/profiles это тот же относительный путь.
const fontPaths: Record<keyof FontFiles, string> = {
  regular: "Inter-Regular.ttf",
  semibold: "Inter-SemiBold.ttf",
  serif: "Merriweather-SemiBold.ttf",
};

let fontFiles: Promise<FontFiles> | undefined;

function loadFonts(): Promise<FontFiles> {
  fontFiles ??= (async () => {
    const entries = await Promise.all(
      Object.entries(fontPaths).map(async ([key, file]) => {
        const bytes = await readFile(join(__dirname, "../../assets", file));
        return [key, bytes] as const;
      }),
    );
    return Object.fromEntries(entries) as FontFiles;
  })();
  return fontFiles;
}

@Injectable()
export class ProfilePdfService {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly profiles: Repository<CandidateProfile>,
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
    @InjectRepository(CandidateSkill)
    private readonly candidateSkills: Repository<CandidateSkill>,
    private readonly users: UsersService,
    private readonly fsp: FspClient,
  ) {}

  // Кандидат скачивает свой профиль из кабинета.
  async renderOwn(
    userId: string,
    template: ResumeTemplate,
  ): Promise<Uint8Array> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Сначала сохраните анкету");
    }
    return this.render(profile, template);
  }

  // Работодатель после принятия приглашения. Доступ проверяет вызывающий.
  async renderProfile(
    profileId: string,
    template: ResumeTemplate,
  ): Promise<Uint8Array> {
    const profile = await this.profiles.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException("Анкета кандидата не найдена");
    }
    return this.render(profile, template);
  }

  private async render(
    profile: CandidateProfile,
    template: ResumeTemplate,
  ): Promise<Uint8Array> {
    const rows = await this.candidateSkills.find({
      where: { profileId: profile.id },
    });
    const ids = rows.map((row) => {
      return row.skillId;
    });
    const skills =
      ids.length > 0 ? await this.skills.find({ where: { id: In(ids) } }) : [];
    const titleOf = new Map(
      skills.map((skill) => {
        return [skill.id, skill.title] as const;
      }),
    );
    const [user, achievements, fonts] = await Promise.all([
      this.users.findById(profile.userId),
      // Скрытую историю ФСП не запрашиваем вовсе.
      profile.showFsp ? this.fsp.achievements(profile.fspId) : [],
      loadFonts(),
    ]);
    const data = buildResume({
      profile,
      skills: rows.flatMap((row) => {
        const title = titleOf.get(row.skillId);
        return title ? [{ title, row }] : [];
      }),
      email: user?.email ?? null,
      achievements,
    });
    return renderResume(data, template, fonts);
  }
}

// Один ответ для обеих ручек: кандидата и работодателя.
export function pdfFile(bytes: Uint8Array): StreamableFile {
  return new StreamableFile(bytes, {
    type: "application/pdf",
    disposition: 'attachment; filename="profile.pdf"',
  });
}
