import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import { In, type Repository } from "typeorm";

import {
  Grade,
  SkillLevel,
  SkillVerification,
  Specialization,
} from "@hh/types";

import { CandidateProfile } from "./candidate-profile.entity";
import { CandidateSkill } from "./candidate-skill.entity";
import { Skill } from "./skill.entity";

const ink = rgb(0x1b / 255, 0x1c / 255, 0x21 / 255);
const accent = rgb(0x40 / 255, 0x2f / 255, 0xff / 255);
const muted = rgb(0x64 / 255, 0x65 / 255, 0x68 / 255);

const specializationLabel: Record<Specialization, string> = {
  [Specialization.Backend]: "Бэкенд",
  [Specialization.Frontend]: "Фронтенд",
  [Specialization.Data]: "Данные",
  [Specialization.Security]: "Информационная безопасность",
};

const gradeLabel: Record<Grade, string> = {
  [Grade.Junior]: "Junior",
  [Grade.Middle]: "Middle",
  [Grade.Senior]: "Senior",
};

const levelLabel: Record<SkillLevel, string> = {
  [SkillLevel.Basic]: "Базовый",
  [SkillLevel.Confident]: "Уверенный",
  [SkillLevel.Strong]: "Сильный",
};

type Pen = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
};

// Nest копирует src/assets в dist/assets. От dist/modules/profiles это тот же относительный путь.
function fontFile(): string {
  return join(__dirname, "../../assets/JetBrainsMono-Regular.ttf");
}

let fontBytes: Promise<Buffer> | undefined;

function loadFont(): Promise<Buffer> {
  fontBytes ??= readFile(fontFile());
  return fontBytes;
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
  ) {}

  async render(userId: string): Promise<Uint8Array> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Сначала сохраните анкету");
    }
    const rows = await this.candidateSkills.find({
      where: { profileId: profile.id },
    });
    const ids = rows.map((row) => {
      return row.skillId;
    });
    const skills =
      ids.length > 0 ? await this.skills.find({ where: { id: In(ids) } }) : [];
    const font = await loadFont();
    return renderProfilePdf(profile, rows, skills, font);
  }
}

async function renderProfilePdf(
  profile: CandidateProfile,
  rows: CandidateSkill[],
  skills: Skill[],
  fontData: Buffer,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Стандартные шрифты pdf-lib не рисуют кириллицу. fontkit встраивает JetBrains Mono.
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontData, { subset: true });
  const page = doc.addPage();
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 8,
    width: page.getWidth(),
    height: 8,
    color: accent,
  });
  const pen: Pen = { doc, page, y: page.getHeight() - 48, font };
  write(pen, "Профиль", 22, accent, 10);
  write(pen, profile.displayName || "Имя не указано", 16, ink, 12);
  write(
    pen,
    `Специализация: ${specializationLabel[profile.specialization]}`,
    11,
    ink,
    4,
  );
  write(
    pen,
    `Заявленный грейд: ${gradeLabel[profile.claimedGrade]}`,
    11,
    ink,
    4,
  );
  write(
    pen,
    `Подтверждённый грейд: ${
      profile.verifiedGrade ? gradeLabel[profile.verifiedGrade] : "нет"
    }`,
    11,
    ink,
    4,
  );
  write(
    pen,
    `Стаж: ${
      profile.experienceYears === null
        ? "не указан"
        : formatYears(profile.experienceYears)
    }`,
    11,
    ink,
    12,
  );
  write(pen, "Образование", 14, accent, 8);
  if (profile.education.length === 0) {
    write(pen, "не указано", 11, muted, 12);
  } else {
    for (const item of profile.education) {
      write(
        pen,
        `${item.school} — ${item.program}, ${yearRange(item.fromYear, item.toYear)}`,
        11,
        ink,
        4,
      );
    }
    pen.y -= 8;
  }
  write(pen, "Опыт", 14, accent, 8);
  if (profile.experience.length === 0) {
    write(pen, "не указано", 11, muted, 12);
  } else {
    for (const item of profile.experience) {
      write(
        pen,
        `${item.company} — ${item.role}, ${yearRange(item.fromYear, item.toYear)}`,
        11,
        ink,
        4,
      );
      write(pen, item.summary, 11, muted, 8);
    }
    pen.y -= 4;
  }
  write(pen, "Навыки", 14, accent, 8);
  const lines = skillLines(rows, skills);
  if (lines.length === 0) {
    write(pen, "Навыки не указаны", 11, muted, 4);
  }
  for (const line of lines) {
    write(pen, line, 11, ink, 4);
  }
  return doc.save();
}

function skillLines(rows: CandidateSkill[], skills: Skill[]): string[] {
  const titleOf = new Map(
    skills.map((skill) => {
      return [skill.id, skill.title] as const;
    }),
  );
  return rows
    .flatMap((row) => {
      const title = titleOf.get(row.skillId);
      if (!title || !row.level) {
        return [];
      }
      const passport = skillPassport(row.verification, row.verifiedAt);
      const level = levelLabel[row.level];
      return [
        passport ? `${title}: ${level}. ${passport}` : `${title}: ${level}`,
      ];
    })
    .sort((left, right) => {
      return left.localeCompare(right, "ru");
    });
}

function skillPassport(
  verification: SkillVerification,
  verifiedAt: Date | null,
): string | null {
  const source =
    verification === SkillVerification.Verified
      ? "Тест"
      : verification === SkillVerification.VerifiedExternal
        ? "ФСП"
        : null;
  if (!source) {
    return null;
  }
  if (!verifiedAt) {
    return source;
  }
  return `${source}, ${verifiedAt.toLocaleDateString("ru-RU")}`;
}

function write(
  pen: Pen,
  text: string,
  size: number,
  color: ReturnType<typeof rgb>,
  gap: number,
): void {
  const maxWidth = pen.page.getWidth() - 96;
  const words = text.split(/\s+/);
  let line = "";
  const flush = (value: string) => {
    if (pen.y < 56) {
      pen.page = pen.doc.addPage();
      pen.y = pen.page.getHeight() - 48;
    }
    pen.page.drawText(value, {
      x: 48,
      y: pen.y,
      size,
      font: pen.font,
      color,
    });
    pen.y -= size + 4;
  };
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (pen.font.widthOfTextAtSize(next, size) > maxWidth && line) {
      flush(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    flush(line);
  }
  pen.y -= gap;
}

// Та же форма, что formatYears на вебе: дробное число — «года».
function yearRange(fromYear: number, toYear: number | null): string {
  if (toYear === null) {
    return `${fromYear} — н. в.`;
  }
  return `${fromYear}–${toYear}`;
}

function formatYears(value: number): string {
  const shown = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
  }).format(value);
  if (!Number.isInteger(value)) {
    return `${shown} года`;
  }
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${shown} лет`;
  }
  if (last === 1) {
    return `${shown} год`;
  }
  if (last >= 2 && last <= 4) {
    return `${shown} года`;
  }
  return `${shown} лет`;
}
