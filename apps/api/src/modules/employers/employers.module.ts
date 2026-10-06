import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CompanyProfile } from "./company-profile.entity";
import { EmployersController } from "./employers.controller";
import { EmployersService } from "./employers.service";
import { HiringNeed } from "./hiring-need.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CompanyProfile, HiringNeed])],
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
