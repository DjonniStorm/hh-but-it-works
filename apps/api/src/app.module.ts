import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HealthController } from "./health.controller";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EmployersModule } from "./modules/employers/employers.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.getOrThrow<string>("DATABASE_URL"),
        autoLoadEntities: true,
        synchronize: true,
        manualInitialization: process.env.OPENAPI_EXPORT === "1",
      }),
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    AssessmentsModule,
    EmployersModule,
    ...(process.env.OPENAPI_EXPORT === "1"
      ? []
      : [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              connection: {
                url: config.getOrThrow<string>("REDIS_URL"),
              },
            }),
          }),
        ]),
  ],
  controllers: [HealthController],
})
export class AppModule {}
