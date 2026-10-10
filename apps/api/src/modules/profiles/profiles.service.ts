import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";

import { coreSkills } from "@hh/assessment-engine";
import type {
  CandidateProfile as CandidateProfileView,
  FspHistory as FspHistoryView,
  FspLinkInput,
  FspLinkPreview as FspLinkPreviewView,
  FspLinkResult,
  SaveProfileInput,
} from "@hh/contracts";
import {
  AttemptStatus,
  Grade,
  SearchStatus,
  SkillLevel,
  SkillVerification,
  Specialization,
} from "@hh/types";

import { FspClient } from "../../common/fsp/fsp.client";
import { UsersService } from "../users/users.service";
import { CandidateProfile } from "./candidate-profile.entity";
import { CandidateSkill } from "./candidate-skill.entity";
import { skillCatalog, slugFromTitle } from "./skill-catalog";
import { Skill } from "./skill.entity";

type SkillSignal = {
  level: SkillLevel;
  verification: SkillVerification;
  verifiedAt: Date | null;
};

type AssessmentOutcome = {
  grade: Grade;
  specialization: Specialization;
  status: AttemptStatus;
  score: number;
  sections: { skillId: string; score: number; passed: boolean }[];
};

// Навык анкеты до записи: id уже проверен, новый навык пока только slug.
type PendingSkill =
  | { skillId: string; level: SkillLevel }
  | { slug: string; title: string; level: SkillLevel };

export type AssessmentSkill = {
  skillId: string;
  slug: string;
  title: string;
};

const gradeChangeCooldownMs = 90 * 24 * 60 * 60 * 1000;
// Навыки каталога сюда не входят: их добавляет и тест, иначе после него анкету было бы не сохранить.
const maxOwnSkills = 50;
const catalogSlugs = new Set<string>(
  skillCatalog.map((item) => {
    return item.slug;
  }),
);

// Навык ядра, которого не было в анкете: уровень берём из подтверждённого грейда.
const levelByGrade: Record<Grade, SkillLevel> = {
  [Grade.Junior]: SkillLevel.Basic,
  [Grade.Middle]: SkillLevel.Confident,
  [Grade.Senior]: SkillLevel.Strong,
};

const gradeLabel: Record<Grade, string> = {
  [Grade.Junior]: "Junior",
  [Grade.Middle]: "Middle",
  [Grade.Senior]: "Senior",
};

@Injectable()
export class ProfilesService implements OnModuleInit {
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

  // Превью привязки ФСП: почта из JWT, поэтому кандидат не может подставить чужую.
  // Недоступный реестр — свой статус, а не «истории нет».
  async fspLinkPreview(userId: string): Promise<FspLinkPreviewView> {
    const user = await this.users.findById(userId);
    if (!user) {
      return { status: "unavailable", participant: null };
    }
    return this.fsp.findByEmail(user.email);
  }

  // Своя история ФСП: пока fspId не привязан, participant null.
  async fspHistory(userId: string): Promise<FspHistoryView> {
    const profile = await this.profiles.findOne({ where: { userId } });
    const participant = await this.fsp.participant(profile?.fspId ?? null);
    return { participant };
  }

  // Привязка без полной анкеты: меняем только два поля, поэтому подходит
  // и свежему кандидату, у которого строки профиля ещё нет.
  async fspLink(userId: string, input: FspLinkInput): Promise<FspLinkResult> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (profile) {
      profile.fspId = input.fspId;
      profile.showFsp = input.showFsp;
      const saved = await this.profiles.save(profile);
      return { fspId: saved.fspId, showFsp: saved.showFsp };
    }
    // Три обязательных поля анкеты не nullable. Ставим заглушки: первое
    // сохранение анкеты заменит их, а до тех пор кандидат не виден в подборке.
    const saved = await this.profiles.save(
      this.profiles.create({
        userId,
        displayName: "",
        specialization: Specialization.Backend,
        claimedGrade: Grade.Junior,
        fspId: input.fspId,
        showFsp: input.showFsp,
      }),
    );
    return { fspId: saved.fspId, showFsp: saved.showFsp };
  }

  // Навыки анкеты из каталога и ядро специализации, даже если его в анкете нет.
  async assessmentSkills(userId: string): Promise<{
    specialization: Specialization;
    skills: AssessmentSkill[];
  }> {
    const profile = await this.requireProfile(userId);
    const rows = await this.candidateSkills.find({
      where: { profileId: profile.id },
    });
    const own = await this.skills.find({
      where: {
        id: In(
          rows.map((row) => {
            return row.skillId;
          }),
        ),
      },
    });
    const core = await this.skills.find({
      where: { slug: In(coreSkills[profile.specialization]) },
    });
    const merged = new Map<string, AssessmentSkill>();
    for (const skill of [...core, ...own]) {
      merged.set(skill.id, {
        skillId: skill.id,
        slug: skill.slug,
        title: skill.title,
      });
    }
    return {
      specialization: profile.specialization,
      skills: [...merged.values()],
    };
  }

  // Пауза проверяется до старта: кандидат не тратит попытку на грейд, который всё равно не сменить.
  async assertGradeChangeAllowed(userId: string, grade: Grade): Promise<void> {
    const profile = await this.requireProfile(userId);
    const until = cooldownUntil(profile);
    const locked = lockedGrade(profile);
    if (locked && locked !== grade && until) {
      throw new ConflictException(
        `Сменить грейд можно после ${until.toLocaleDateString("ru-RU")}. Сейчас доступен тест на ${gradeLabel[locked]}.`,
      );
    }
  }

  async applyAssessment(
    userId: string,
    result: AssessmentOutcome,
  ): Promise<{ gradeChanged: boolean }> {
    const profile = await this.requireProfile(userId);
    // Попытку собирали под другую специализацию: её секции и грейд к этой анкете не относятся.
    if (result.specialization !== profile.specialization) {
      throw new ConflictException(
        "Специализация сменилась во время теста. Начните новую попытку",
      );
    }
    // Аннулированная попытка не меняет ни навыки, ни грейд.
    if (result.status === AttemptStatus.Annulled) {
      return { gradeChanged: false };
    }

    const confirmedAt = new Date();
    for (const section of result.sections) {
      const row = await this.candidateSkills.findOne({
        where: { profileId: profile.id, skillId: section.skillId },
      });
      if (!row && section.passed) {
        await this.candidateSkills.save(
          this.candidateSkills.create({
            profileId: profile.id,
            skillId: section.skillId,
            level: levelByGrade[result.grade],
            verification: SkillVerification.Verified,
            score: section.score,
            verifiedAt: confirmedAt,
          }),
        );
        continue;
      }
      if (!row) {
        continue;
      }
      row.verification = section.passed
        ? SkillVerification.Verified
        : SkillVerification.Unverified;
      row.score = section.passed ? section.score : null;
      row.verifiedAt = section.passed ? confirmedAt : null;
      await this.candidateSkills.save(row);
    }

    if (result.status !== AttemptStatus.Passed) {
      return { gradeChanged: false };
    }
    const locked = lockedGrade(profile);
    // Во время паузы засчитываем только грейд, на котором она держится.
    if (cooldownUntil(profile) && locked && locked !== result.grade) {
      return { gradeChanged: false };
    }
    const gradeChanged = profile.verifiedGrade !== result.grade;
    profile.assessmentScore = result.score;
    profile.listed = true;
    if (gradeChanged) {
      profile.verifiedGrade = result.grade;
      profile.verifiedAt = new Date();
    }
    // Новый грейд начинает паузу. Тот же грейд после смены специализации её не продлевает.
    if (result.grade !== locked) {
      profile.cooldownGrade = result.grade;
      profile.cooldownFrom = new Date();
    }
    await this.profiles.save(profile);
    return { gradeChanged };
  }

  private async requireProfile(userId: string): Promise<CandidateProfile> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new BadRequestException("Сначала сохраните анкету");
    }
    return profile;
  }

  async save(
    userId: string,
    input: SaveProfileInput,
  ): Promise<CandidateProfileView> {
    // Навыки разбираем до записи: неизвестный skillId вернёт 400, ничего не тронув.
    const pending = await this.checkSkills(input.skills);
    // Анкета, новые строки каталога и навыки пишутся вместе: сбой посередине ничего не оставит.
    const profile = await this.profiles.manager.transaction(async (manager) => {
      const saved = await this.upsertProfile(manager, userId, input);
      const assessed = await this.resolveSkills(manager, pending);
      await this.replaceSkills(manager, saved.id, assessed);
      return saved;
    });
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
        await this.skills.save(
          this.skills.create({ slug: item.slug, title: item.title }),
        );
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
        verifiedAt: row.verifiedAt,
      });
    }
    return signals;
  }

  private async upsertProfile(
    manager: EntityManager,
    userId: string,
    input: SaveProfileInput,
  ): Promise<CandidateProfile> {
    const profiles = manager.getRepository(CandidateProfile);
    const links = blankLinks(input);
    const existing = await profiles.findOne({ where: { userId } });
    if (!existing) {
      return profiles.save(
        profiles.create({
          userId,
          displayName: input.displayName,
          specialization: input.specialization,
          claimedGrade: input.claimedGrade,
          listed: false,
          softSkills: input.softSkills,
          ...links,
          ...expectations(input),
        }),
      );
    }

    // Грейд подтверждали тестом по старой специализации: в новой его ещё нет.
    if (existing.specialization !== input.specialization) {
      // Пауза на смену грейда остаётся, иначе её обходят двумя сохранениями анкеты.
      existing.cooldownGrade = lockedGrade(existing);
      existing.cooldownFrom = existing.cooldownFrom ?? existing.verifiedAt;
      existing.verifiedGrade = null;
      existing.verifiedAt = null;
      existing.assessmentScore = null;
      existing.listed = false;
    }
    existing.displayName = input.displayName;
    existing.specialization = input.specialization;
    existing.claimedGrade = input.claimedGrade;
    existing.fspId = links.fspId;
    existing.phone = links.phone;
    existing.telegram = links.telegram;
    existing.github = links.github;
    existing.linkedin = links.linkedin;
    existing.website = links.website;
    existing.softSkills = input.softSkills;
    Object.assign(existing, expectations(input));
    // Иначе listed не трогаем: на биржу выводит только подтверждение.
    return profiles.save(existing);
  }

  private async checkSkills(
    skills: SaveProfileInput["skills"],
  ): Promise<PendingSkill[]> {
    const pending: PendingSkill[] = [];
    for (const skill of skills) {
      if (skill.level === null) {
        continue;
      }
      if ("skillId" in skill) {
        pending.push({ skillId: skill.skillId, level: skill.level });
        continue;
      }
      const slug = slugFromTitle(skill.title);
      if (!slug) {
        throw new BadRequestException("Укажите навык");
      }
      pending.push({ slug, title: skill.title.trim(), level: skill.level });
    }

    const ids = new Set(
      pending.flatMap((item) => {
        return "skillId" in item ? [item.skillId] : [];
      }),
    );
    const known =
      ids.size > 0
        ? await this.skills.find({ where: { id: In([...ids]) } })
        : [];
    if (known.length !== ids.size) {
      throw new BadRequestException("Неизвестный навык");
    }

    const slugs = [
      ...known.map((skill) => {
        return skill.slug;
      }),
      ...pending.flatMap((item) => {
        return "slug" in item ? [item.slug] : [];
      }),
    ];
    const own = new Set(
      slugs.filter((slug) => {
        return !catalogSlugs.has(slug);
      }),
    );
    if (own.size > maxOwnSkills) {
      throw new BadRequestException(`Не больше ${maxOwnSkills} навыков`);
    }
    return pending;
  }

  // Новые навыки добавляет в каталог одной вставкой, id всех берёт одним запросом.
  private async resolveSkills(
    manager: EntityManager,
    pending: PendingSkill[],
  ): Promise<Map<string, SkillLevel>> {
    // Одинаковый slug из разных написаний («C++», «c++») — один навык, имя берём первое.
    const titles = new Map<string, string>();
    for (const item of pending) {
      if ("slug" in item && !titles.has(item.slug)) {
        titles.set(item.slug, item.title);
      }
    }

    const idBySlug = new Map<string, string>();
    if (titles.size > 0) {
      // Навык мог уже появиться в каталоге, в том числе из соседнего запроса.
      await manager
        .createQueryBuilder()
        .insert()
        .into(Skill)
        .values(
          [...titles].map(([slug, title]) => {
            return { slug, title };
          }),
        )
        .orIgnore()
        .execute();
      const rows = await manager.getRepository(Skill).find({
        where: { slug: In([...titles.keys()]) },
      });
      for (const row of rows) {
        idBySlug.set(row.slug, row.id);
      }
    }

    const assessed = new Map<string, SkillLevel>();
    for (const item of pending) {
      const skillId =
        "skillId" in item ? item.skillId : idBySlug.get(item.slug);
      if (!skillId) {
        throw new BadRequestException("Неизвестный навык");
      }
      assessed.set(skillId, item.level);
    }
    return assessed;
  }

  private async replaceSkills(
    manager: EntityManager,
    profileId: string,
    assessed: Map<string, SkillLevel>,
  ): Promise<void> {
    const candidateSkills = manager.getRepository(CandidateSkill);
    const previous = await candidateSkills.find({ where: { profileId } });
    const kept = new Map(
      previous.map((row) => {
        return [row.skillId, row] as const;
      }),
    );
    await candidateSkills.delete({ profileId });
    if (assessed.size === 0) {
      return;
    }
    await candidateSkills.save(
      [...assessed.entries()].map(([skillId, level]) => {
        const prior = kept.get(skillId);
        const sameLevel = prior?.level === level;
        return candidateSkills.create({
          profileId,
          skillId,
          level,
          verification: sameLevel
            ? prior.verification
            : SkillVerification.Unverified,
          score: sameLevel ? prior.score : null,
          verifiedAt: sameLevel ? prior.verifiedAt : null,
        });
      }),
    );
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
      phone: profile?.phone ?? null,
      telegram: profile?.telegram ?? null,
      github: profile?.github ?? null,
      linkedin: profile?.linkedin ?? null,
      website: profile?.website ?? null,
      softSkills: profile?.softSkills ?? [],
      desiredSalaryFrom: profile?.desiredSalaryFrom ?? null,
      experienceYears: profile?.experienceYears ?? null,
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      workFormats: profile?.workFormats ?? [],
      searchStatus: profile?.searchStatus ?? SearchStatus.OpenToOffers,
      showExperience: profile?.showExperience ?? true,
      showSalary: profile?.showSalary ?? true,
      showFsp: profile?.showFsp ?? true,
      showUnverifiedSkills: profile?.showUnverifiedSkills ?? true,
      listed: profile?.listed ?? false,
      verifiedGrade: profile?.verifiedGrade ?? null,
      verifiedAt: profile?.verifiedAt?.toISOString() ?? null,
      assessmentScore: profile?.assessmentScore ?? null,
      nextGradeChangeAt: profile
        ? (cooldownUntil(profile)?.toISOString() ?? null)
        : null,
      skills: catalog.map((skill) => {
        const signal = signals.get(skill.id);
        return {
          skillId: skill.id,
          slug: skill.slug,
          title: skill.title,
          level: signal?.level ?? null,
          verification: signal?.verification ?? null,
          verifiedAt: signal?.verifiedAt?.toISOString() ?? null,
        };
      }),
    };
  }
}

function blankLinks(input: SaveProfileInput): {
  fspId: string | null;
  phone: string | null;
  telegram: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
} {
  return {
    fspId: blank(input.fspId),
    phone: blank(input.phone),
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
  | "desiredSalaryFrom"
  | "experienceYears"
  | "education"
  | "experience"
  | "workFormats"
  | "searchStatus"
  | "showExperience"
  | "showSalary"
  | "showFsp"
  | "showUnverifiedSkills"
> {
  return {
    desiredSalaryFrom: input.desiredSalaryFrom,
    experienceYears: input.experienceYears,
    education: input.education,
    experience: input.experience,
    workFormats: input.workFormats,
    searchStatus: input.searchStatus,
    showExperience: input.showExperience,
    showSalary: input.showSalary,
    showFsp: input.showFsp,
    showUnverifiedSkills: input.showUnverifiedSkills,
  };
}

// Грейд, на котором держится пауза. У старых записей поля паузы пустые: берём подтверждённый.
function lockedGrade(profile: CandidateProfile): Grade | null {
  return profile.cooldownGrade ?? profile.verifiedGrade;
}

// Пока пауза не прошла, возвращает дату её конца.
function cooldownUntil(profile: CandidateProfile): Date | null {
  const from = profile.cooldownFrom ?? profile.verifiedAt;
  if (!from) {
    return null;
  }
  const until = new Date(from.getTime() + gradeChangeCooldownMs);
  return until.getTime() > Date.now() ? until : null;
}

function blank(value: string): string | null {
  return value === "" ? null : value;
}
