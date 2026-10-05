import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "apps/api/openapi.json",
  output: "apps/web/src/shared/api/generated",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./apps/web/src/shared/api/hey-api.ts",
    },
  ],
});
