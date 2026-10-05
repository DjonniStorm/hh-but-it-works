import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { createOpenApiDocument } from "./swagger";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:5173" });
  app.useGlobalPipes(new ZodValidationPipe());

  SwaggerModule.setup("docs", app, createOpenApiDocument(app));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
