import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type {
  CompanyProfile as CompanyProfileView,
  CompanyResponse,
  HiringNeedInput,
  HiringNeedList,
  HiringNeedRecord,
} from "@hh/contracts";

import { CompanyProfile } from "./company-profile.entity";
import { HiringNeed } from "./hiring-need.entity";

@Injectable()
export class EmployersService {
  constructor(
    @InjectRepository(CompanyProfile)
    private readonly companies: Repository<CompanyProfile>,
    @InjectRepository(HiringNeed)
    private readonly needs: Repository<HiringNeed>,
  ) {}

  async getCompany(userId: string): Promise<CompanyResponse> {
    const company = await this.companies.findOne({ where: { userId } });
    return { company: company ? toCompanyView(company) : null };
  }

  async saveCompany(
    userId: string,
    input: CompanyProfileView,
  ): Promise<CompanyProfileView> {
    const existing = await this.companies.findOne({ where: { userId } });
    const saved = await this.companies.save(
      existing
        ? this.companies.merge(existing, input)
        : this.companies.create({ ...input, userId }),
    );
    return toCompanyView(saved);
  }

  async listNeeds(userId: string): Promise<HiringNeedList> {
    const rows = await this.needs.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return { items: rows.map(toNeedView) };
  }

  async getNeed(userId: string, id: string): Promise<HiringNeedRecord> {
    // Чужую потребность не отдаём: для работодателя её просто нет.
    const need = await this.needs.findOne({ where: { id, userId } });
    if (!need) {
      throw new NotFoundException("Потребность не найдена");
    }
    return toNeedView(need);
  }

  async createNeed(
    userId: string,
    input: HiringNeedInput,
  ): Promise<HiringNeedRecord> {
    const need = await this.needs.save(this.needs.create({ ...input, userId }));
    return toNeedView(need);
  }
}

function toCompanyView(company: CompanyProfile): CompanyProfileView {
  return {
    name: company.name,
    industry: company.industry,
    description: company.description,
    website: company.website,
    contactEmail: company.contactEmail,
    contactTelegram: company.contactTelegram,
  };
}

function toNeedView(need: HiringNeed): HiringNeedRecord {
  return {
    id: need.id,
    title: need.title,
    specialization: need.specialization,
    gradeFrom: need.gradeFrom,
    gradeTo: need.gradeTo,
    mustSkills: need.mustSkills,
    niceSkills: need.niceSkills,
    workFormat: need.workFormat,
    salaryFrom: need.salaryFrom,
    salaryTo: need.salaryTo,
    description: need.description,
    createdAt: need.createdAt.toISOString(),
  };
}
