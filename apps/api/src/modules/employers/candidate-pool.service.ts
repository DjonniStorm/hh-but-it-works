import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import type { CandidateSnapshot, HiringNeedInput } from "@hh/contracts";
import { SearchStatus, gradeIndex } from "@hh/types";

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
    return this.profiles.find({ where: { listed: true } });
  }

  // Своя специализация и грейд в диапазоне потребности ±1 ступень.
  // Грейд берём подтверждённый, если тест уже был, иначе заявленный.
  eligible(need: NeedFilter, pool: CandidateProfile[]): CandidateProfile[] {
    const from = gradeIndex(need.gradeFrom);
    const to = gradeIndex(need.gradeTo);
    return pool.filter((profile) => {
      if (profile.searchStatus === SearchStatus.Hidden) {
        return false;
      }
      if (profile.specialization !== need.specialization) {
        return false;
      }
      const grade = gradeIndex(profile.verifiedGrade ?? profile.claimedGrade);
      return grade >= from - 1 && grade <= to + 1;
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
        gradeConfidence: null,
        experienceYears: profile.experienceYears,
        skills: rows
          .filter((row) => {
            return row.profileId === profile.id;
          })
          .map((row) => {
            return {
              title: titles.get(row.skillId) ?? "",
              level: row.level,
              verification: row.verification,
              score: null,
            };
          }),
        assessmentScore: profile.assessmentScore,
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

// Имя и контакты работодатель видит только после принятия приглашения (ТЗ 2.2.2).
export function aliasOf(profileId: string): string {
  return `Кандидат #${profileId.slice(0, 6).toUpperCase()}`;
}
