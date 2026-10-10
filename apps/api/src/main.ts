import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { createOpenApiDocument } from "./swagger";

// Origin веба через запятую. По умолчанию — Vite на 5173 и запасной порт 5174.
function corsOrigins(value: string | undefined): string[] {
  return (value ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => {
      return origin.trim();
    })
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // credentials: локально веб и API на разных портах, а refresh-токен в cookie.
  // На проде веб и API на одном домене, CORS там не участвует.
  app.enableCors({
    origin: corsOrigins(app.get(ConfigService).get<string>("CORS_ORIGINS")),
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  SwaggerModule.setup("docs", app, createOpenApiDocument(app));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
