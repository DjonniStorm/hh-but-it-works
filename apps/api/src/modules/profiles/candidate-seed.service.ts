import { randomBytes } from "node:crypto";

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Role, SkillVerification } from "@hh/types";

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

// Сид-кандидаты для подборки работодателя. Под каждого — пользователь со случайным паролем.
// Если задан SEED_CANDIDATE_PASSWORD и это не production, под ними можно войти
// и ответить на приглашение: seed.<код>@candidates.hh.test, например seed.b101@….
@Injectable()
export class CandidateSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CandidateSeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
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
    await this.applySeedPassword();
  }

  // Каждый старт: пароль из .env действует и для засеянных раньше, и после его смены.
  // Без переменной — новый случайный пароль: убрать её из .env значит закрыть вход.
  private async applySeedPassword(): Promise<void> {
    const known = this.config.get<string>("SEED_CANDIDATE_PASSWORD");
    const production = this.config.get<string>("NODE_ENV") === "production";
    if (known && production) {
      this.logger.warn(
        "SEED_CANDIDATE_PASSWORD игнорируется в production: вход под сидами закрыт",
      );
    }
    const open = Boolean(known) && !production;
    const password =
      open && known ? known : randomBytes(24).toString("base64url");
    const ids: string[] = [];
    for (const seed of candidateSeeds) {
      const user = await this.users.findByEmail(seedEmail(seed));
      if (user) {
        ids.push(user.id);
      }
    }
    await this.users.setPassword(ids, password);
    if (open) {
      this.logger.log(`Вход под сид-кандидатами открыт: ${ids.length}`);
    }
  }

  private async ensure(seed: CandidateSeed): Promise<boolean> {
    const code = seed.id.toLowerCase();
    const email = seedEmail(seed);
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
          verifiedAt:
            skill.verification === SkillVerification.Unverified
              ? null
              : new Date("2026-01-15T00:00:00.000Z"),
        }),
      );
    }
    return true;
  }

  // Тот же slug, что в ProfilesService.resolveSkills: один навык — одна строка в skills.
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

function seedEmail(seed: CandidateSeed): string {
  return `seed.${seed.id.toLowerCase()}@candidates.hh.test`;
}
