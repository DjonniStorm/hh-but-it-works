import { Module } from "@nestjs/common";

import { FspClient } from "./fsp.client";

// Реестр ФСП читают подборка работодателя и PDF-профиль кандидата. Один клиент — одно соединение с Redis.
@Module({
  providers: [FspClient],
  exports: [FspClient],
})
export class FspModule {}
