// @ts-check

import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import jestPlugin from "eslint-plugin-jest";
import promisePlugin from "eslint-plugin-promise";
import securityPlugin from "eslint-plugin-security";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  promisePlugin.configs["flat/recommended"],
  sonarjsPlugin.configs.recommended,
  jestPlugin.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    rules: {
      // NestJS e TypeScript
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/no-floating-promises": "error",
      // Flexibilidade para decorators e classes
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      // Segurança
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-script-url": "error",
      // Organização e boas práticas de imports
      "import/order": "off",
      "import/no-unresolved": "off",
      "import/no-extraneous-dependencies": "off",
      // Segurança
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      // Code Smells
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/unused-import": "error",
      "sonarjs/no-commented-code": "error",
      "sonarjs/no-dead-store": "error",
      "sonarjs/todo-tag": "error",
      "sonarjs/no-redundant-jump": "error",
      "sonarjs/no-hardcoded-passwords": "error",
      "sonarjs/no-ignored-exceptions": "error",
      "sonarjs/no-unused-vars": "error",
      // Promises
      "promise/always-return": "warn",
      "promise/no-return-wrap": "warn",
      // Testes
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/expect-expect": "off",
      // Regras de conforto e segurança já existentes
      "class-methods-use-this": "off",
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": "off",
      "prettier/prettier": "off",
      // Novas regras solicitadas
      "max-lines-per-function": "off",
      "complexity": "off",
      "no-console": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "test/**"],
    rules: {
      "max-lines-per-function": "off",
      "complexity": "off",
      "no-console": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
];
