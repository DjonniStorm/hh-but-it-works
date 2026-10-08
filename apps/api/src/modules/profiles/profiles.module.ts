import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersModule } from "../users/users.module";
import { CandidateProfile } from "./candidate-profile.entity";
import { CandidateSeedService } from "./candidate-seed.service";
import { CandidateSkill } from "./candidate-skill.entity";
import { ProfilePdfService } from "./profile-pdf";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { ResumeDraftService } from "./resume-draft.service";
import { Skill } from "./skill.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateProfile, Skill, CandidateSkill]),
    UsersModule,
  ],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    CandidateSeedService,
    ResumeDraftService,
    ProfilePdfService,
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {}
