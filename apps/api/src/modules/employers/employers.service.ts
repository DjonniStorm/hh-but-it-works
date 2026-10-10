import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import {
  type CandidateSearch,
  type CandidateSearchResult,
  type CompanyProfile as CompanyProfileView,
  type CompanyResponse,
  type HiringNeedInput,
  type HiringNeedList,
  type HiringNeed as HiringNeedView,
  type Match,
  type Shortlist,
  type ShortlistCategory,
  candidateSearchLimit,
} from "@hh/contracts";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidatePoolService, categoriesOf } from "./candidate-pool.service";
import { CompanyProfile } from "./company-profile.entity";
import { HiringNeed } from "./hiring-need.entity";
import { NeedDismissal } from "./need-dismissal.entity";
import { NeedFavorite } from "./need-favorite.entity";
import { RankingClient } from "./ranking.client";

@Injectable()
export class EmployersService implements OnModuleInit {
  constructor(
    @InjectRepository(CompanyProfile)
    private readonly companies: Repository<CompanyProfile>,
    @InjectRepository(HiringNeed)
    private readonly needs: Repository<HiringNeed>,
    @InjectRepository(NeedDismissal)
    private readonly dismissals: Repository<NeedDismissal>,
    @InjectRepository(NeedFavorite)
    private readonly favorites: Repository<NeedFavorite>,
    private readonly pool: CandidatePoolService,
    private readonly ranking: RankingClient,
  ) {}

  // Потребности, созданные с одним форматом, переносим в список. Повторный запуск ничего не меняет.
  async onModuleInit(): Promise<void> {
    if (process.env.OPENAPI_EXPORT === "1") {
      return;
    }
    await this.needs.query(
      `UPDATE hiring_needs SET "workFormats" = ARRAY["workFormat"::text]
       WHERE "workFormat" IS NOT NULL AND cardinality("workFormats") = 0`,
    );
  }

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
    // Один запрос пула и один запрос «не подходит» на все потребности, счёт в памяти.
    const [listed, dismissed] = await Promise.all([
      this.pool.listed(),
      this.dismissedByNeed(
        rows.map((need) => {
          return need.id;
        }),
      ),
    ]);
    return {
      items: rows.map((need) => {
        return this.toNeedView(
          need,
          listed,
          dismissed.get(need.id) ?? new Set(),
        );
      }),
    };
  }

  async getNeed(userId: string, id: string): Promise<HiringNeedView> {
    const need = await this.requireNeed(userId, id);
    const [listed, dismissed] = await Promise.all([
      this.pool.listed(),
      this.dismissedIds(need.id),
    ]);
    return this.toNeedView(need, listed, dismissed);
  }

  async createNeed(
    userId: string,
    input: HiringNeedInput,
  ): Promise<HiringNeedView> {
    const need = await this.needs.save(this.needs.create({ ...input, userId }));
    return this.toNeedView(need, await this.pool.listed(), new Set());
  }

  // Отклонённые и приглашения остаются: «Не подходит» относится к человеку, а не к тексту.
  // Приглашения хранят свои текст и вилку, название потребности подтянут уже новое.
  async updateNeed(
    userId: string,
    id: string,
    input: HiringNeedInput,
  ): Promise<HiringNeedView> {
    const need = await this.requireNeed(userId, id);
    const saved = await this.needs.save(this.needs.merge(need, input));
    const [listed, dismissed] = await Promise.all([
      this.pool.listed(),
      this.dismissedIds(saved.id),
    ]);
    return this.toNeedView(saved, listed, dismissed);
  }

  // Мягкое удаление: отправленные приглашения по потребности остаются в силе и с названием.
  // «Не подходит» и избранное нужны только подборке, их удаляем вместе с ней.
  async deleteNeed(userId: string, id: string): Promise<void> {
    const need = await this.requireNeed(userId, id);
    await this.needs.manager.transaction(async (manager) => {
      await manager.delete(NeedDismissal, { needId: need.id });
      await manager.delete(NeedFavorite, { needId: need.id });
      await manager.softDelete(HiringNeed, { id: need.id });
    });
  }

  async shortlist(userId: string, needId: string): Promise<Shortlist> {
    const need = await this.requireNeed(userId, needId);
    const [listed, dismissed, favorites] = await Promise.all([
      this.pool.listed(),
      this.dismissedIds(need.id),
      this.favoriteIds(need.id),
    ]);
    const candidates = await this.pool.snapshots(
      this.pool.eligible(need, listed),
    );
    const ranked = await this.ranking.rank(need, candidates);

    const items: Match[] = candidates.map((candidate) => {
      const result = ranked.scores.get(candidate.id);
      const rawScore = clampScore(result?.rawScore ?? 0);
      const score = toHundred(rawScore);
      const qualification = clampScore(result?.qualification ?? score);
      const opportunityFit = clampScore(result?.opportunityFit ?? score);
      return {
        candidate,
        matchScore: score,
        qualification,
        opportunityFit,
        reasons: result?.reasons ?? [],
        risks: result?.risks ?? [],
        breakdown: result?.breakdown ?? [],
        dismissed: dismissed.has(candidate.id),
        favorite: favorites.has(candidate.id),
      };
    });
    items.sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }
      // Тай-брейк: по сырой квалификации, затем поassessmentScore кандидата.
      // Текущая модель ранжирования возвращает сырое значение matchScore
      // → qualificationScore → assessmentScore для разрешения ничьих.
      // Добавьте сюда использование result?.rawQualification, если модель вернёт его.
      return (
        (right.candidate.assessmentScore ?? 0) -
        (left.candidate.assessmentScore ?? 0)
      );
    });
    return {
      needId: need.id,
      modelVersion: ranked.modelVersion,
      categories: countCategories(need, items),
      items,
    };
  }

  // Без потребности ранжировать не по чему: сначала сильный результат теста.
  async searchCandidates(
    filter: CandidateSearch,
  ): Promise<CandidateSearchResult> {
    const found = await this.pool.search(filter);
    found.sort((left, right) => {
      return (right.assessmentScore ?? 0) - (left.assessmentScore ?? 0);
    });
    return {
      items: found.slice(0, candidateSearchLimit),
      total: found.length,
    };
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

  async setFavorite(
    userId: string,
    needId: string,
    candidateProfileId: string,
    favorite: boolean,
  ): Promise<Shortlist> {
    const need = await this.requireNeed(userId, needId);
    if (favorite) {
      await this.favorites.upsert({ needId: need.id, candidateProfileId }, [
        "needId",
        "candidateProfileId",
      ]);
    } else {
      await this.favorites.delete({ needId: need.id, candidateProfileId });
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

  private async favoriteIds(needId: string): Promise<Set<string>> {
    const rows = await this.favorites.find({ where: { needId } });
    return new Set(
      rows.map((row) => {
        return row.candidateProfileId;
      }),
    );
  }

  private async dismissedIds(needId: string): Promise<Set<string>> {
    return (await this.dismissedByNeed([needId])).get(needId) ?? new Set();
  }

  private async dismissedByNeed(
    needIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const byNeed = new Map<string, Set<string>>();
    if (needIds.length === 0) {
      return byNeed;
    }
    const rows = await this.dismissals.find({
      where: { needId: In(needIds) },
    });
    for (const row of rows) {
      const ids = byNeed.get(row.needId) ?? new Set<string>();
      ids.add(row.candidateProfileId);
      byNeed.set(row.needId, ids);
    }
    return byNeed;
  }

  private toNeedView(
    need: HiringNeed,
    listed: CandidateProfile[],
    dismissed: Set<string>,
  ): HiringNeedView {
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
      workFormats: need.workFormats,
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

// Сколько кандидатов подборки (без отклонённых) в каждой категории потребности.
// В подборку попадают только с подтверждённым грейдом, поэтому считаем по нему.
function countCategories(
  need: HiringNeed,
  items: Match[],
): ShortlistCategory[] {
  const counts = items.reduce((acc, item) => {
    const grade = item.candidate.verifiedGrade;
    if (!item.dismissed && grade !== null) {
      acc.set(grade, (acc.get(grade) ?? 0) + 1);
    }
    return acc;
  }, new Map<string, number>());
  return categoriesOf(need).map((category) => {
    return { ...category, candidateCount: counts.get(category.grade) ?? 0 };
  });
}

// Контракт подборки: оценка 0–100. Ранжирователь отдаёт 0–1, клиент уже умножает.
function clampScore(score: number): number {
  return Math.round(Math.min(100, Math.max(0, score)));
}
