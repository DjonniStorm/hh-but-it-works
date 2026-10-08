import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfilesModule } from "../profiles/profiles.module";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { AttemptRecord } from "./attempt-record.entity";
import { AttemptStore } from "./attempt.store";

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([AttemptRecord])],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AttemptStore],
})
export class AssessmentsModule {}
