import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";

import type { CandidateSnapshot, HiringNeedInput } from "@hh/contracts";
import { Grade, SearchStatus, gradeIndex, gradeOrder } from "@hh/types";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidateSkill } from "../profiles/candidate-skill.entity";
import { Skill } from "../profiles/skill.entity";
import { FspClient } from "./fsp.client";

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

  // На бирже только подтверждённые (listed) и не скрывшиеся кандидаты.
  listed(): Promise<CandidateProfile[]> {
    return this.profiles.find({
      where: { listed: true, searchStatus: Not(SearchStatus.Hidden) },
    });
  }

  // Своя специализация и подтверждённый грейд в диапазоне потребности ±1 ступень.
  // Заявленный грейд не открывает доступ к verified talent marketplace.
  // pool — результат listed(): подборка и счётчик в списке потребностей отбирают одинаково.
  eligible(need: NeedFilter, pool: CandidateProfile[]): CandidateProfile[] {
    const grades = gradesAround(need);
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
        experienceYears: profile.experienceYears,
        skills: (skillsByProfile.get(profile.id) ?? []).map((row) => {
          return {
            title: titles.get(row.skillId) ?? "",
            level: row.level,
            verification: row.verification,
            score: row.score,
          };
        }),
        assessmentScore: profile.assessmentScore,
        profileFreshness: profileFreshness(
          profile.verifiedAt ?? profile.updatedAt,
        ),
        fspAchievements: achievements[index] ?? [],
        preferences: {
          desiredSalaryFrom: profile.desiredSalaryFrom,
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

// Грейды потребности и по ступени вокруг: для junior–middle это junior, middle, senior.
function gradesAround(need: NeedFilter): Grade[] {
  const from = gradeIndex(need.gradeFrom);
  const to = gradeIndex(need.gradeTo);
  return gradeOrder.slice(Math.max(0, from - 1), to + 2);
}

// Имя и контакты работодатель видит только после принятия приглашения (ТЗ 2.2.2).
export function aliasOf(profileId: string): string {
  return `Кандидат #${profileId.slice(0, 6).toUpperCase()}`;
}
