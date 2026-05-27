// @ts-check

import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import jestPlugin from "eslint-plugin-jest";
import promisePlugin from "eslint-plugin-promise";
import securityPlugin from "eslint-plugin-security";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["eslint.config.mjs", "dist/**", "coverage/**", "generated/**"],
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
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    rules: {
      // NestJS e TypeScript
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      // Flexibilidade para decorators e classes
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      // Segurança
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-script-url": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty": "warn",
      // Organização e boas práticas de imports
      "import/order": "off",
      "import/no-unresolved": "off",
      "import/no-extraneous-dependencies": "off",
      // Segurança
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      // Code Smells
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/unused-import": "warn",
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
      "complexity": ["warn", 15],
      "max-lines-per-function": ["warn", 200],
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
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "test/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "max-lines-per-function": ["warn", 250],
      "complexity": ["warn", 20],
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
