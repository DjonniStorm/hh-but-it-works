import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidateSkill } from "../profiles/candidate-skill.entity";
import { Skill } from "../profiles/skill.entity";
import { User } from "../users/user.entity";
import { CandidateInvitationsController } from "./candidate-invitations.controller";
import { CandidatePoolService } from "./candidate-pool.service";
import { CompanyProfile } from "./company-profile.entity";
import { EmployersController } from "./employers.controller";
import { EmployersService } from "./employers.service";
import { FspClient } from "./fsp.client";
import { HiringNeed } from "./hiring-need.entity";
import { Invitation } from "./invitation.entity";
import { InvitationsService } from "./invitations.service";
import { NeedDismissal } from "./need-dismissal.entity";
import { RankingClient } from "./ranking.client";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyProfile,
      HiringNeed,
      NeedDismissal,
      Invitation,
      // Кандидатов подборка читает из модуля профилей, только на чтение.
      CandidateProfile,
      CandidateSkill,
      Skill,
      User,
    ]),
  ],
  // Ответ кандидата живёт рядом с приглашениями: те же сущности и правила статусов.
  controllers: [EmployersController, CandidateInvitationsController],
  providers: [
    EmployersService,
    InvitationsService,
    CandidatePoolService,
    FspClient,
    RankingClient,
  ],
})
export class EmployersModule {}
