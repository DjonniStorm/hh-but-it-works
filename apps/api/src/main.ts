import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { createOpenApiDocument } from "./swagger";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // credentials: локально веб и API на разных портах, а refresh-токен в cookie.
  // На проде веб и API на одном домене, CORS там не участвует.
  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  SwaggerModule.setup("docs", app, createOpenApiDocument(app));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
