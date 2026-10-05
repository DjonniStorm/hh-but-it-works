import path from "node:path";
import process from "node:process";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react({})],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "@hh/types": path.resolve(
        process.cwd(),
        "../../packages/types/src/index.ts",
      ),
      "@hh/contracts": path.resolve(
        process.cwd(),
        "../../packages/contracts/src/index.ts",
      ),
    },
  },
});
