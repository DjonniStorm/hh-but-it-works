import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type FindOptionsWhere, In, IsNull, Not, Repository } from "typeorm";

import type {
  CandidateSnapshot,
  CategoryMatch,
  HiringNeedInput,
} from "@hh/contracts";
import {
  Grade,
  SearchStatus,
  SkillVerification,
  gradeIndex,
  gradeOrder,
} from "@hh/types";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidateSkill } from "../profiles/candidate-skill.entity";
import { Skill } from "../profiles/skill.entity";
import { FspClient } from "./fsp.client";

// Кого работодатель видит на бирже: тест сдан (listed), грейд подтверждён, кандидат
// не скрылся. Подборка, счётчик и приглашение проверяют одно и то же условие.
export const onExchange = {
  listed: true,
  verifiedGrade: Not(IsNull()),
  searchStatus: Not(SearchStatus.Hidden),
} satisfies FindOptionsWhere<CandidateProfile>;

type NeedFilter = Pick<
  HiringNeedInput,
  "specialization" | "gradeFrom" | "gradeTo"
>;

// Кто может попасть в подборку и что о нём видит работодатель.
// Правила отбора — бизнес-логика Nest, оценку ставит apps/ranking (мастер-план, A4).
@Injectable()
export class CandidatePoolService {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly profiles: Repository<CandidateProfile>,
    @InjectRepository(CandidateSkill)
    private readonly candidateSkills: Repository<CandidateSkill>,
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
    private readonly fsp: FspClient,
  ) {}

  listed(): Promise<CandidateProfile[]> {
    return this.profiles.find({ where: onExchange });
  }

  // Своя специализация и подтверждённый грейд в диапазоне потребности ±1 ступень.
  // Заявленный грейд не открывает доступ к verified talent marketplace.
  // pool — результат listed(): подборка и счётчик в списке потребностей отбирают одинаково.
  eligible(need: NeedFilter, pool: CandidateProfile[]): CandidateProfile[] {
    const grades = categoriesOf(need).map((category) => {
      return category.grade;
    });
    return pool.filter((profile) => {
      if (profile.specialization !== need.specialization) {
        return false;
      }
      return (
        profile.verifiedGrade !== null && grades.includes(profile.verifiedGrade)
      );
    });
  }

  async snapshots(profiles: CandidateProfile[]): Promise<CandidateSnapshot[]> {
    if (profiles.length === 0) {
      return [];
    }
    const profileIds = profiles.map((profile) => {
      return profile.id;
    });
    const rows = await this.candidateSkills.find({
      where: { profileId: In(profileIds) },
    });
    const skillIds = [
      ...new Set(
        rows.map((row) => {
          return row.skillId;
        }),
      ),
    ];
    const skills = await this.skills.find({ where: { id: In(skillIds) } });
    const titles = new Map(
      skills.map((skill) => {
        return [skill.id, skill.title] as const;
      }),
    );
    const skillsByProfile = new Map<string, CandidateSkill[]>();
    for (const row of rows) {
      const list = skillsByProfile.get(row.profileId) ?? [];
      list.push(row);
      skillsByProfile.set(row.profileId, list);
    }
    const achievements = await Promise.all(
      profiles.map((profile) => {
        return this.fsp.achievements(profile.fspId);
      }),
    );

    return profiles.map((profile, index) => {
      return {
        id: profile.id,
        alias: aliasOf(profile.id),
        specialization: profile.specialization,
        claimedGrade: profile.claimedGrade,
        verifiedGrade: profile.verifiedGrade,
        gradeConfidence:
          profile.assessmentScore === null
            ? null
            : profile.assessmentScore / 100,
        experienceYears: profile.showExperience
          ? profile.experienceYears
          : null,
        skills: (skillsByProfile.get(profile.id) ?? [])
          .filter((row) => {
            return (
              profile.showUnverifiedSkills ||
              row.verification !== SkillVerification.Unverified
            );
          })
          .map((row) => {
            return {
              title: titles.get(row.skillId) ?? "",
              level: row.level,
              verification: row.verification,
              score: row.score,
              verifiedAt: row.verifiedAt?.toISOString() ?? null,
            };
          }),
        assessmentScore: profile.assessmentScore,
        profileFreshness: profileFreshness(
          profile.verifiedAt ?? profile.updatedAt,
        ),
        fspAchievements: profile.showFsp ? (achievements[index] ?? []) : [],
        preferences: {
          desiredSalaryFrom: profile.showSalary
            ? profile.desiredSalaryFrom
            : null,
          workFormats: profile.workFormats,
          searchStatus: profile.searchStatus,
        },
      };
    });
  }
}

export function profileFreshness(lastSignalAt: Date, now = Date.now()): number {
  const ageDays = Math.max(0, now - lastSignalAt.getTime()) / 86_400_000;
  if (ageDays <= 180) {
    return 1;
  }
  if (ageDays <= 365) {
    return 0.7;
  }
  return 0.4;
}

// Грейды потребности и по ступени вокруг: для junior–middle это junior, middle (exact)
// и senior (adjacent). По этому же списку подборка отбирает кандидатов.
export function categoriesOf(
  need: NeedFilter,
): { grade: Grade; match: CategoryMatch }[] {
  const from = gradeIndex(need.gradeFrom);
  const to = gradeIndex(need.gradeTo);
  return gradeOrder.slice(Math.max(0, from - 1), to + 2).map((grade) => {
    const index = gradeIndex(grade);
    return {
      grade,
      match: index >= from && index <= to ? "exact" : "adjacent",
    };
  });
}

// Имя и контакты работодатель видит только после принятия приглашения (ТЗ 2.2.2).
export function aliasOf(profileId: string): string {
  return `Кандидат #${profileId.slice(0, 6).toUpperCase()}`;
}
