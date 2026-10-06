import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import type { CandidateProfile as CandidateProfileView } from "@hh/contracts";
import type { SaveProfileInput } from "@hh/contracts";
import { Grade, SearchStatus, SkillLevel, SkillVerification } from "@hh/types";

import { CandidateProfile } from "./candidate-profile.entity";
import { CandidateSkill } from "./candidate-skill.entity";
import { skillCatalog, slugFromTitle } from "./skill-catalog";
import { Skill } from "./skill.entity";

type SkillSignal = {
  level: SkillLevel;
  verification: SkillVerification;
};

type AssessmentOutcome = {
  grade: Grade;
  passed: boolean;
  score: number;
  skills: { skillId: string; score: number }[];
};

const gradeChangeCooldownMs = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class ProfilesService implements OnModuleInit {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly profiles: Repository<CandidateProfile>,
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
    @InjectRepository(CandidateSkill)
    private readonly candidateSkills: Repository<CandidateSkill>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Выгрузка OpenAPI поднимает Nest без базы.
    if (process.env.OPENAPI_EXPORT === "1") {
      return;
    }
    await this.seedSkills();
  }

  async get(userId: string): Promise<CandidateProfileView> {
    const profile = await this.profiles.findOne({ where: { userId } });
    const signals = await this.signalsOf(profile?.id);
    const catalog = await this.visibleSkills(profile?.id, signals);
    return this.toView(profile, catalog, signals);
  }

  async assessmentSkills(
    userId: string,
  ): Promise<{ skillId: string; slug: string }[]> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new BadRequestException("Сначала сохраните анкету");
    }
    const rows = await this.candidateSkills.find({
      where: { profileId: profile.id },
    });
    if (rows.length === 0) {
      return [];
    }
    const known = await this.skills.find({
      where: {
        id: In(
          rows.map((row) => {
            return row.skillId;
          }),
        ),
      },
    });
    const slugs = new Map(
      known.map((skill) => {
        return [skill.id, skill.slug] as const;
      }),
    );
    return rows.flatMap((row) => {
      const slug = slugs.get(row.skillId);
      if (!slug) {
        return [];
      }
      return [{ skillId: row.skillId, slug }];
    });
  }

  async applyAssessment(
    userId: string,
    result: AssessmentOutcome,
  ): Promise<void> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new BadRequestException("Сначала сохраните анкету");
    }
    const gradeChanges =
      result.passed && profile.verifiedGrade !== result.grade;
    if (
      gradeChanges &&
      profile.verifiedAt &&
      Date.now() - profile.verifiedAt.getTime() < gradeChangeCooldownMs
    ) {
      throw new ConflictException("Сменить грейд можно раз в 90 дней");
    }

    for (const skill of result.skills) {
      const row = await this.candidateSkills.findOne({
        where: { profileId: profile.id, skillId: skill.skillId },
      });
      if (!row) {
        continue;
      }
      if (skill.score === 100) {
        row.verification = SkillVerification.Verified;
        row.score = 100;
      } else {
        row.verification = SkillVerification.Unverified;
        row.score = null;
      }
      await this.candidateSkills.save(row);
    }

    if (!result.passed) {
      return;
    }
    profile.assessmentScore = result.score;
    profile.listed = true;
    if (gradeChanges) {
      profile.verifiedGrade = result.grade;
      profile.verifiedAt = new Date();
    }
    await this.profiles.save(profile);
  }

  async save(
    userId: string,
    input: SaveProfileInput,
  ): Promise<CandidateProfileView> {
    const profile = await this.upsertProfile(userId, input);
    await this.replaceSkills(profile.id, input.skills);
    const signals = await this.signalsOf(profile.id);
    const catalog = await this.visibleSkills(profile.id, signals);
    return this.toView(profile, catalog, signals);
  }

  private async seedSkills(): Promise<void> {
    for (const item of skillCatalog) {
      const existing = await this.skills.findOne({
        where: { slug: item.slug },
      });
      if (!existing) {
        await this.skills.save(this.skills.create(item));
      }
    }
  }

  private async visibleSkills(
    profileId: string | undefined,
    signals: Map<string, SkillSignal>,
  ): Promise<Skill[]> {
    const seeds = await this.skills.find({
      where: { slug: In(skillCatalog.map((item) => item.slug)) },
      order: { title: "ASC" },
    });
    if (!profileId) {
      return seeds;
    }
    const seedIds = new Set(seeds.map((skill) => skill.id));
    const extraIds = [...signals.keys()].filter((id) => {
      return !seedIds.has(id);
    });
    if (extraIds.length === 0) {
      return seeds;
    }
    const extras = await this.skills.find({ where: { id: In(extraIds) } });
    return [...seeds, ...extras].sort((left, right) => {
      return left.title.localeCompare(right.title, "ru");
    });
  }

  private async signalsOf(
    profileId: string | undefined,
  ): Promise<Map<string, SkillSignal>> {
    const signals = new Map<string, SkillSignal>();
    if (!profileId) {
      return signals;
    }
    const rows = await this.candidateSkills.find({ where: { profileId } });
    for (const row of rows) {
      signals.set(row.skillId, {
        level: row.level,
        verification: row.verification,
      });
    }
    return signals;
  }

  private async upsertProfile(
    userId: string,
    input: SaveProfileInput,
  ): Promise<CandidateProfile> {
    const links = blankLinks(input);
    const existing = await this.profiles.findOne({ where: { userId } });
    if (!existing) {
      return this.profiles.save(
        this.profiles.create({
          userId,
          displayName: input.displayName,
          specialization: input.specialization,
          claimedGrade: input.claimedGrade,
          listed: false,
          ...links,
          ...expectations(input),
        }),
      );
    }

    existing.displayName = input.displayName;
    existing.specialization = input.specialization;
    existing.claimedGrade = input.claimedGrade;
    existing.fspId = links.fspId;
    existing.telegram = links.telegram;
    existing.github = links.github;
    existing.linkedin = links.linkedin;
    existing.website = links.website;
    Object.assign(existing, expectations(input));
    // listed не трогаем: на биржу выводит только подтверждение.
    return this.profiles.save(existing);
  }

  private async replaceSkills(
    profileId: string,
    skills: SaveProfileInput["skills"],
  ): Promise<void> {
    const previous = await this.candidateSkills.find({ where: { profileId } });
    const kept = new Map(
      previous.map((row) => {
        return [row.skillId, row] as const;
      }),
    );
    await this.candidateSkills.delete({ profileId });
    const assessed = new Map<string, SkillLevel>();
    for (const skill of skills) {
      if (skill.level === null) {
        continue;
      }
      const skillId = await this.resolveSkillId(skill);
      assessed.set(skillId, skill.level);
    }
    if (assessed.size === 0) {
      return;
    }
    await this.candidateSkills.save(
      [...assessed.entries()].map(([skillId, level]) => {
        const prior = kept.get(skillId);
        const sameLevel = prior?.level === level;
        return this.candidateSkills.create({
          profileId,
          skillId,
          level,
          verification: sameLevel
            ? prior.verification
            : SkillVerification.Unverified,
          score: sameLevel ? prior.score : null,
        });
      }),
    );
  }

  private async resolveSkillId(
    skill: SaveProfileInput["skills"][number],
  ): Promise<string> {
    if ("skillId" in skill) {
      const existing = await this.skills.findOne({
        where: { id: skill.skillId },
      });
      if (!existing) {
        throw new BadRequestException("Неизвестный навык");
      }
      return existing.id;
    }
    const slug = slugFromTitle(skill.title);
    if (!slug) {
      throw new BadRequestException("Укажите навык");
    }
    const existing = await this.skills.findOne({ where: { slug } });
    if (existing) {
      return existing.id;
    }
    const created = await this.skills.save(
      this.skills.create({ slug, title: skill.title.trim() }),
    );
    return created.id;
  }

  private toView(
    profile: CandidateProfile | null,
    catalog: Skill[],
    signals: Map<string, SkillSignal>,
  ): CandidateProfileView {
    return {
      displayName: profile?.displayName ?? "",
      specialization: profile?.specialization ?? null,
      claimedGrade: profile?.claimedGrade ?? null,
      fspId: profile?.fspId ?? null,
      telegram: profile?.telegram ?? null,
      github: profile?.github ?? null,
      linkedin: profile?.linkedin ?? null,
      website: profile?.website ?? null,
      desiredSalaryFrom: profile?.desiredSalaryFrom ?? null,
      workFormats: profile?.workFormats ?? [],
      searchStatus: profile?.searchStatus ?? SearchStatus.OpenToOffers,
      listed: profile?.listed ?? false,
      skills: catalog.map((skill) => {
        const signal = signals.get(skill.id);
        return {
          skillId: skill.id,
          slug: skill.slug,
          title: skill.title,
          level: signal?.level ?? null,
          verification: signal?.verification ?? null,
        };
      }),
    };
  }
}

function blankLinks(input: SaveProfileInput): {
  fspId: string | null;
  telegram: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
} {
  return {
    fspId: blank(input.fspId),
    telegram: blank(input.telegram),
    github: blank(input.github),
    linkedin: blank(input.linkedin),
    website: blank(input.website),
  };
}

function expectations(
  input: SaveProfileInput,
): Pick<
  CandidateProfile,
  "desiredSalaryFrom" | "workFormats" | "searchStatus"
> {
  return {
    desiredSalaryFrom: input.desiredSalaryFrom,
    workFormats: input.workFormats,
    searchStatus: input.searchStatus,
  };
}

function blank(value: string): string | null {
  return value === "" ? null : value;
}
