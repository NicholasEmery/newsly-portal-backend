// @ts-check

import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import importTypescript from "eslint-plugin-import/config/typescript.js";
import securityPlugin from "eslint-plugin-security";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import promisePlugin from "eslint-plugin-promise";
import jestPlugin from "eslint-plugin-jest";

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  importPlugin.configs.recommended,
  importTypescript,
  securityPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,
  promisePlugin,
  jestPlugin.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module",
        ecmaVersion: "latest",
      },
      env: {
        node: true,
        jest: true,
        es2021: true,
      },
    },
    rules: {
      // NestJS e TypeScript
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: {
            "{}": false,
          },
          extendDefaults: true,
        },
      ],
      // Flexibilidade para decorators e classes
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "warn",
      // Segurança
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-script-url": "error",
      // Organização e boas práticas de imports
      "import/order": ["warn", { alphabetize: { order: "asc" }, groups: [["builtin", "external", "internal"]] }],
      "import/no-unresolved": "error",
      "import/no-extraneous-dependencies": "warn",
      // Segurança
      "security/detect-object-injection": "warn",
      // Code Smells
      "sonarjs/cognitive-complexity": ["warn", 15],
      // Promises
      "promise/always-return": "warn",
      "promise/no-return-wrap": "warn",
      // Testes
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      // Regras de conforto e segurança já existentes
      "class-methods-use-this": "off",
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": "off",
      "prettier/prettier": "warn",
      "promisePlugin/catch-or-return": "warn",
      // Novas regras solicitadas
      "max-lines-per-function": ["warn", { max: 50, skipBlankLines: true, skipComments: true }],
      "complexity": ["warn", 10],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/strict-boolean-expressions": "warn",
    },
    overrides: [
      {
        files: ["**/*.spec.ts", "**/*.test.ts", "test/**"],
        rules: {
          "max-lines-per-function": "off",
          "complexity": "off",
          "no-console": "off",
        },
        languageOptions: {
          env: { jest: true },
        },
      },
      {
        files: ["**/*.js"],
        rules: {
          "@typescript-eslint/strict-boolean-expressions": "off",
        },
      },
    ],
  },
];
