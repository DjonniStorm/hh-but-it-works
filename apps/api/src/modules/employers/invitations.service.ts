import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";

import type {
  CandidateInvitationList,
  CandidateInvitation as CandidateInvitationView,
  InvitationInput,
  InvitationList,
  Invitation as InvitationView,
} from "@hh/contracts";
import { InvitationStatus } from "@hh/types";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { User } from "../users/user.entity";
import { aliasOf } from "./candidate-pool.service";
import { CompanyProfile } from "./company-profile.entity";
import { EmployersService } from "./employers.service";
import { HiringNeed } from "./hiring-need.entity";
import { Invitation } from "./invitation.entity";

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    @InjectRepository(CandidateProfile)
    private readonly profiles: Repository<CandidateProfile>,
    @InjectRepository(HiringNeed)
    private readonly needs: Repository<HiringNeed>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CompanyProfile)
    private readonly companies: Repository<CompanyProfile>,
    private readonly employers: EmployersService,
  ) {}

  async list(userId: string): Promise<InvitationList> {
    const rows = await this.invitations.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    const companyName = (await this.employers.companyName(userId)) ?? "";
    const needTitles = await this.needTitles(rows);
    const contacts = await this.contacts(rows);
    return {
      items: rows.map((row) => {
        return toView(row, companyName, needTitles, contacts);
      }),
    };
  }

  async create(
    userId: string,
    input: InvitationInput,
  ): Promise<InvitationView> {
    // В приглашении кандидат видит название компании (ТЗ 2.2.2): без профиля его нет.
    const companyName = await this.employers.companyName(userId);
    if (!companyName) {
      throw new BadRequestException("Сначала заполните профиль компании");
    }
    const candidate = await this.profiles.findOne({
      where: { id: input.candidateId, listed: true },
    });
    if (!candidate) {
      throw new NotFoundException("Кандидат не найден");
    }
    if (input.needId) {
      await this.employers.requireNeed(userId, input.needId);
    }
    // Одно активное предложение кандидату от компании, в какой бы потребности оно ни было.
    // После отказа можно пригласить снова. То же правило на фронте: InvitationStore.hasActive.
    const active = await this.invitations.findOne({
      where: {
        userId,
        candidateProfileId: candidate.id,
        status: Not(InvitationStatus.Declined),
      },
    });
    if (active) {
      throw new ConflictException("Этому кандидату уже отправлено приглашение");
    }

    const saved = await this.invitations.save(
      this.invitations.create({
        userId,
        candidateProfileId: candidate.id,
        needId: input.needId,
        message: input.message,
        contact: input.contact,
        salaryFrom: input.salaryFrom,
        salaryTo: input.salaryTo,
        status: InvitationStatus.Sent,
      }),
    );
    return toView(
      saved,
      companyName,
      await this.needTitles([saved]),
      new Map(),
    );
  }

  async listForCandidate(userId: string): Promise<CandidateInvitationList> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      return { items: [] };
    }
    const rows = await this.invitations.find({
      where: { candidateProfileId: profile.id },
      order: { createdAt: "DESC" },
    });
    const companies = await this.companiesOf(rows);
    const needTitles = await this.needTitles(rows);
    return {
      items: rows.map((row) => {
        return toCandidateView(row, companies, needTitles);
      }),
    };
  }

  // Экран показал эти приглашения: новые из них становятся просмотренными, работодатель это видит.
  async markViewed(userId: string, ids: string[]): Promise<void> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      return;
    }
    await this.invitations.update(
      {
        id: In(ids),
        candidateProfileId: profile.id,
        status: InvitationStatus.Sent,
      },
      { status: InvitationStatus.Viewed },
    );
  }

  async answer(
    userId: string,
    invitationId: string,
    status: InvitationStatus.Accepted | InvitationStatus.Declined,
  ): Promise<CandidateInvitationView> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Приглашение не найдено");
    }
    const mine = { id: invitationId, candidateProfileId: profile.id };
    // Ответ один раз: условие на статус в самом UPDATE, без гонки между проверкой и записью.
    const result = await this.invitations.update(
      {
        ...mine,
        status: In([InvitationStatus.Sent, InvitationStatus.Viewed]),
      },
      { status },
    );
    const row = await this.invitations.findOne({ where: mine });
    if (!row) {
      throw new NotFoundException("Приглашение не найдено");
    }
    if (!result.affected) {
      throw new ConflictException("Вы уже ответили на это приглашение");
    }
    return toCandidateView(
      row,
      await this.companiesOf([row]),
      await this.needTitles([row]),
    );
  }

  private async companiesOf(
    rows: Invitation[],
  ): Promise<Map<string, CompanyProfile>> {
    const userIds = [
      ...new Set(
        rows.map((row) => {
          return row.userId;
        }),
      ),
    ];
    if (userIds.length === 0) {
      return new Map();
    }
    const companies = await this.companies.find({
      where: { userId: In(userIds) },
    });
    return new Map(
      companies.map((company) => {
        return [company.userId, company] as const;
      }),
    );
  }

  private async needTitles(rows: Invitation[]): Promise<Map<string, string>> {
    const ids = [
      ...new Set(
        rows.flatMap((row) => {
          return row.needId ? [row.needId] : [];
        }),
      ),
    ];
    if (ids.length === 0) {
      return new Map();
    }
    const needs = await this.needs.find({ where: { id: In(ids) } });
    return new Map(
      needs.map((need) => {
        return [need.id, need.title] as const;
      }),
    );
  }

  // Контакт кандидата открывается только после принятия приглашения (ТЗ 2.2.2).
  private async contacts(rows: Invitation[]): Promise<Map<string, string>> {
    const accepted = rows.filter((row) => {
      return row.status === InvitationStatus.Accepted;
    });
    if (accepted.length === 0) {
      return new Map();
    }
    const profileIds = accepted.map((row) => {
      return row.candidateProfileId;
    });
    const profiles = await this.profiles.find({
      where: { id: In(profileIds) },
    });
    const userIds = profiles.map((profile) => {
      return profile.userId;
    });
    const users = await this.users.find({ where: { id: In(userIds) } });
    const emails = new Map(
      users.map((user) => {
        return [user.id, user.email] as const;
      }),
    );
    return new Map(
      profiles.map((profile) => {
        const contact = profile.telegram ?? emails.get(profile.userId) ?? "";
        return [profile.id, contact] as const;
      }),
    );
  }
}

function toCandidateView(
  row: Invitation,
  companies: Map<string, CompanyProfile>,
  needTitles: Map<string, string>,
): CandidateInvitationView {
  const company = companies.get(row.userId);
  return {
    id: row.id,
    companyName: company?.name ?? "",
    companyIndustry: company?.industry ?? "",
    needTitle: row.needId ? (needTitles.get(row.needId) ?? null) : null,
    message: row.message,
    contact: row.contact,
    salaryFrom: row.salaryFrom,
    salaryTo: row.salaryTo,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toView(
  row: Invitation,
  companyName: string,
  needTitles: Map<string, string>,
  contacts: Map<string, string>,
): InvitationView {
  return {
    id: row.id,
    candidateId: row.candidateProfileId,
    needId: row.needId,
    message: row.message,
    contact: row.contact,
    salaryFrom: row.salaryFrom,
    salaryTo: row.salaryTo,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    companyName,
    candidateAlias: aliasOf(row.candidateProfileId),
    needTitle: row.needId ? (needTitles.get(row.needId) ?? null) : null,
    candidateContact:
      row.status === InvitationStatus.Accepted
        ? (contacts.get(row.candidateProfileId) ?? null)
        : null,
  };
}
