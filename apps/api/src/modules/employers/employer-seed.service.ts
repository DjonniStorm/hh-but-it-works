import { randomBytes } from "node:crypto";

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Role } from "@hh/types";

import { UsersService } from "../users/users.service";
import { CompanyProfile } from "./company-profile.entity";
import {
  type EmployerSeed,
  demoEmployerIds,
  employerSeedEmail,
  employerSeeds,
} from "./employer-seed.data";
import { HiringNeed } from "./hiring-need.entity";

// Сид-работодатели для демо: компания и потребности под каждым, пароль случайный.
// Если задан DEMO_PASSWORD (и в production тоже), под demoEmployerIds можно войти:
// employer.<id>@employers.hh.test.
@Injectable()
export class EmployerSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmployerSeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
    @InjectRepository(CompanyProfile)
    private readonly companies: Repository<CompanyProfile>,
    @InjectRepository(HiringNeed)
    private readonly needs: Repository<HiringNeed>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Выгрузка OpenAPI поднимает Nest без базы.
    if (process.env.OPENAPI_EXPORT === "1") {
      return;
    }
    let created = 0;
    for (const seed of employerSeeds) {
      if (await this.ensure(seed)) {
        created += 1;
      }
    }
    if (created > 0) {
      this.logger.log(`Сид-работодателей создано: ${created}`);
    }
    await this.applyDemoPassword();
  }

  // Каждый старт: без DEMO_PASSWORD демо-аккаунты получают новый случайный пароль,
  // то есть убрать переменную значит закрыть вход.
  private async applyDemoPassword(): Promise<void> {
    const demo = this.config.get<string>("DEMO_PASSWORD");
    const ids: string[] = [];
    for (const seed of employerSeeds) {
      if (!demoEmployerIds.includes(seed.id)) {
        continue;
      }
      const user = await this.users.findByEmail(employerSeedEmail(seed));
      if (user) {
        ids.push(user.id);
      }
    }
    await this.users.setPassword(
      ids,
      demo || randomBytes(24).toString("base64url"),
    );
    if (demo) {
      this.logger.log(`Демо-вход открыт, работодатели: ${ids.length}`);
    }
  }

  private async ensure(seed: EmployerSeed): Promise<boolean> {
    const email = employerSeedEmail(seed);
    // Уже засеян — не трогаем, чтобы повторный старт не перетирал правки.
    if (await this.users.findByEmail(email)) {
      return false;
    }
    const user = await this.users.create({
      email,
      password: randomBytes(24).toString("base64url"),
      role: Role.Employer,
    });
    await this.users.markEmailVerified(user.id);

    await this.companies.save(
      this.companies.create({
        userId: user.id,
        name: seed.name,
        industry: seed.industry,
        description: seed.description,
        website: seed.website,
        contactEmail: email,
        contactTelegram: `@${seed.id}_hr`,
      }),
    );
    for (const need of seed.needs) {
      await this.needs.save(this.needs.create({ ...need, userId: user.id }));
    }
    return true;
  }
}
