import { Module } from "@nestjs/common";

import { ProfilesModule } from "../profiles/profiles.module";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { AttemptStore } from "./attempt.store";

@Module({
  imports: [ProfilesModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AttemptStore],
})
export class AssessmentsModule {}
