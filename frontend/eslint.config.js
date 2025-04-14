import js from "@eslint/js";
import globals from "globals";
import reactDom from "eslint-plugin-react-dom";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactX from "eslint-plugin-react-x";
import tseslint from "typescript-eslint";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";

export default tseslint.config(
  { ignores: ["dist", "src/client"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeCheckedOnly,
      ...tseslint.configs.stylisticTypeCheckedOnly,
      ...pluginRouter.configs["flat/recommended"],
      ...pluginQuery.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.node.json", "./.tsconfig.app.json"],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-dom": reactDom,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react-x": reactX,
    },
    rules: {
      ...reactDom.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      ...reactX.configs["recommended-typescript"].rules,
    },
  },
);
