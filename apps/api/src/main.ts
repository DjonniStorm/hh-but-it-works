import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe, cleanupOpenApiDoc } from "nestjs-zod";
import "reflect-metadata";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:5173" });
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder().setTitle("HH API").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, cleanupOpenApiDoc(document));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
