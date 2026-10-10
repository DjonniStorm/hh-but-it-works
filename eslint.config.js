import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      // Венв apps/ranking по примеру из apps/ranking/README.md#Dev (см. .gitignore)
      "**/rank-venv/**",
      // CommonJS-скрипты пакетов: require() здесь единственная возможность импорта.
      "**/*.cjs",
      "apps/web/src/shared/api/generated/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  eslintConfigPrettier,
);
