import "reflect-metadata";

process.env.OPENAPI_EXPORT = "1";

async function main(): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  const { NestFactory } = await import("@nestjs/core");

  const { AppModule } = await import("./app.module");
  const { createOpenApiDocument } = await import("./swagger");

  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  await writeFile(
    "openapi.json",
    `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
  );
  await app.close();
}

void main();
