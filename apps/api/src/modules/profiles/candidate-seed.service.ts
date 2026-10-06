import { randomBytes } from "node:crypto";

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Role } from "@hh/types";

import { UsersService } from "../users/users.service";
import { CandidateProfile } from "./candidate-profile.entity";
import {
  type CandidateSeed,
  candidateSeeds,
  seedFspId,
} from "./candidate-seed.data";
import { CandidateSkill } from "./candidate-skill.entity";
import { slugFromTitle } from "./skill-catalog";
import { Skill } from "./skill.entity";

// Сид-кандидаты для подборки работодателя. Под каждого — пользователь с паролем,
// который никто не знает: войти под ними нельзя, они нужны только на бирже.
@Injectable()
export class CandidateSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CandidateSeedService.name);

  constructor(
    private readonly users: UsersService,
    @InjectRepository(CandidateProfile)
    private readonly profiles: Repository<CandidateProfile>,
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
    @InjectRepository(CandidateSkill)
    private readonly candidateSkills: Repository<CandidateSkill>,
  ) {}

  // OnApplicationBootstrap идёт после всех onModuleInit: каталог навыков уже засеян.
  async onApplicationBootstrap(): Promise<void> {
    // Выгрузка OpenAPI поднимает Nest без базы.
    if (process.env.OPENAPI_EXPORT === "1") {
      return;
    }
    let created = 0;
    for (const seed of candidateSeeds) {
      if (await this.ensure(seed)) {
        created += 1;
      }
    }
    if (created > 0) {
      this.logger.log(`Сид-кандидатов создано: ${created}`);
    }
  }

  private async ensure(seed: CandidateSeed): Promise<boolean> {
    const code = seed.id.toLowerCase();
    const email = `seed.${code}@candidates.hh.test`;
    // Уже засеян — не трогаем, чтобы повторный старт не перетирал правки.
    if (await this.users.findByEmail(email)) {
      return false;
    }
    const user = await this.users.create({
      email,
      password: randomBytes(24).toString("base64url"),
      role: Role.Candidate,
    });
    await this.users.markEmailVerified(user.id);

    const profile = await this.profiles.save(
      this.profiles.create({
        userId: user.id,
        displayName: `Кандидат ${seed.id}`,
        specialization: seed.specialization,
        claimedGrade: seed.claimed,
        fspId: seedFspId(seed),
        telegram: `@candidate_${code}`,
        github: null,
        linkedin: null,
        website: null,
        desiredSalaryFrom: seed.salary,
        workFormats: seed.formats,
        searchStatus: seed.status,
        verifiedGrade: seed.verified,
        assessmentScore: seed.assessment,
        experienceYears: seed.years,
        listed: true,
      }),
    );

    for (const skill of seed.skills) {
      const skillId = await this.skillIdFor(skill.title);
      await this.candidateSkills.save(
        this.candidateSkills.create({
          profileId: profile.id,
          skillId,
          level: skill.level,
          verification: skill.verification,
        }),
      );
    }
    return true;
  }

  // Тот же slug, что в ProfilesService.resolveSkillId: один навык — одна строка в skills.
  private async skillIdFor(title: string): Promise<string> {
    const slug = slugFromTitle(title);
    const existing = await this.skills.findOne({ where: { slug } });
    if (existing) {
      return existing.id;
    }
    const created = await this.skills.save(this.skills.create({ slug, title }));
    return created.id;
  }
}
