import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FspModule } from "../../common/fsp/fsp.module";
import { MailModule } from "../../common/mail/mail.module";
import { CandidateProfile } from "../profiles/candidate-profile.entity";
import { CandidateSkill } from "../profiles/candidate-skill.entity";
import { ProfilesModule } from "../profiles/profiles.module";
import { Skill } from "../profiles/skill.entity";
import { User } from "../users/user.entity";
import { UsersModule } from "../users/users.module";
import { CandidateInvitationsController } from "./candidate-invitations.controller";
import { CandidatePoolService } from "./candidate-pool.service";
import { CompanyProfile } from "./company-profile.entity";
import { EmployerSeedService } from "./employer-seed.service";
import { EmployersController } from "./employers.controller";
import { EmployersService } from "./employers.service";
import { HiringNeed } from "./hiring-need.entity";
import { Invitation } from "./invitation.entity";
import { InvitationsService } from "./invitations.service";
import { NeedDismissal } from "./need-dismissal.entity";
import { NeedFavorite } from "./need-favorite.entity";
import { RankingClient } from "./ranking.client";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyProfile,
      HiringNeed,
      NeedDismissal,
      NeedFavorite,
      Invitation,
      // Кандидатов подборка читает из модуля профилей, только на чтение.
      CandidateProfile,
      CandidateSkill,
      Skill,
      User,
    ]),
    MailModule,
    FspModule,
    // PDF-резюме принятого кандидата рисует модуль профилей.
    ProfilesModule,
    UsersModule,
  ],
  // Ответ кандидата живёт рядом с приглашениями: те же сущности и правила статусов.
  controllers: [EmployersController, CandidateInvitationsController],
  providers: [
    EmployersService,
    InvitationsService,
    CandidatePoolService,
    EmployerSeedService,
    RankingClient,
  ],
})
export class EmployersModule {}
