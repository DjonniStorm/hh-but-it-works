import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type {
  CompanyProfile as CompanyProfileView,
  CompanyResponse,
  HiringNeedInput,
  HiringNeedList,
  HiringNeed as HiringNeedView,
  Match,
  Shortlist,
} from "@hh/contracts";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidatePoolService } from "./candidate-pool.service";
import { CompanyProfile } from "./company-profile.entity";
import { HiringNeed } from "./hiring-need.entity";
import { NeedDismissal } from "./need-dismissal.entity";
import { RankingClient } from "./ranking.client";

// Версия модели в ответе: пока ранжирует заглушка apps/ranking.
const modelVersion = "ranking-stub";

@Injectable()
export class EmployersService {
  constructor(
    @InjectRepository(CompanyProfile)
    private readonly companies: Repository<CompanyProfile>,
    @InjectRepository(HiringNeed)
    private readonly needs: Repository<HiringNeed>,
    @InjectRepository(NeedDismissal)
    private readonly dismissals: Repository<NeedDismissal>,
    private readonly pool: CandidatePoolService,
    private readonly ranking: RankingClient,
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
    // Один запрос пула на все потребности: число кандидатов считаем в памяти.
    const listed = await this.pool.listed();
    const items = await Promise.all(
      rows.map((need) => {
        return this.toNeedView(need, listed);
      }),
    );
    return { items };
  }

  async getNeed(userId: string, id: string): Promise<HiringNeedView> {
    return this.toNeedView(
      await this.requireNeed(userId, id),
      await this.pool.listed(),
    );
  }

  async createNeed(
    userId: string,
    input: HiringNeedInput,
  ): Promise<HiringNeedView> {
    const need = await this.needs.save(this.needs.create({ ...input, userId }));
    return this.toNeedView(need, await this.pool.listed());
  }

  async shortlist(userId: string, needId: string): Promise<Shortlist> {
    const need = await this.requireNeed(userId, needId);
    const candidates = await this.pool.snapshots(
      this.pool.eligible(need, await this.pool.listed()),
    );
    const scores = await this.ranking.rank(need, candidates);
    const dismissed = await this.dismissedIds(need.id);

    const items: Match[] = candidates.map((candidate) => {
      const result = scores.get(candidate.id);
      const score = clampScore(result?.score ?? 0);
      // Группы, риски и отдельные оценки квалификации и условий отдаст настоящий ranking.
      return {
        candidate,
        matchScore: score,
        qualification: score,
        opportunityFit: score,
        reasons: result?.reasons ?? [],
        risks: [],
        breakdown: [],
        dismissed: dismissed.has(candidate.id),
      };
    });
    items.sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }
      return (
        (right.candidate.assessmentScore ?? 0) -
        (left.candidate.assessmentScore ?? 0)
      );
    });
    return { needId: need.id, modelVersion, items };
  }

  async setDismissed(
    userId: string,
    needId: string,
    candidateProfileId: string,
    dismissed: boolean,
  ): Promise<Shortlist> {
    const need = await this.requireNeed(userId, needId);
    if (dismissed) {
      await this.dismissals.upsert({ needId: need.id, candidateProfileId }, [
        "needId",
        "candidateProfileId",
      ]);
    } else {
      await this.dismissals.delete({ needId: need.id, candidateProfileId });
    }
    return this.shortlist(userId, needId);
  }

  async requireNeed(userId: string, id: string): Promise<HiringNeed> {
    // Чужую потребность не отдаём: для работодателя её просто нет.
    const need = await this.needs.findOne({ where: { id, userId } });
    if (!need) {
      throw new NotFoundException("Потребность не найдена");
    }
    return need;
  }

  async companyName(userId: string): Promise<string | null> {
    const company = await this.companies.findOne({ where: { userId } });
    return company?.name ?? null;
  }

  private async dismissedIds(needId: string): Promise<Set<string>> {
    const rows = await this.dismissals.find({ where: { needId } });
    return new Set(
      rows.map((row) => {
        return row.candidateProfileId;
      }),
    );
  }

  private async toNeedView(
    need: HiringNeed,
    listed: CandidateProfile[],
  ): Promise<HiringNeedView> {
    const dismissed = await this.dismissedIds(need.id);
    const candidateCount = this.pool
      .eligible(need, listed)
      .filter((profile) => {
        return !dismissed.has(profile.id);
      }).length;
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
      candidateCount,
    };
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

// Контракт подборки: оценка 0–100. Заглушка ranking отдаёт 0.
function clampScore(score: number): number {
  return Math.round(Math.min(100, Math.max(0, score)));
}
