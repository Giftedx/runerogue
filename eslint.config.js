// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  // 1. Global Ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "archives/**",
      "client/godot/**",
      "external-repos/**",
      "logs/**",
      "pnpm-lock.yaml",
      "*.log",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.vite/**",
      ".github/**",
      "eslint.config.js", // Never lint the lint config itself.
    ],
  },

  // 2. Base ESLint Recommended Config
  eslint.configs.recommended,

  // 3. TypeScript Configuration (Type-Aware and Scoped)
  ...tseslint.config({
    files: [
      "packages/**/*.ts",
      "client/src/**/*.ts",
      "packages/**/*.tsx",
      "client/src/**/*.tsx",
    ],
    ignores: ["**/*.d.ts"], // Explicitly ignore .d.ts files here
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  }),

  // 4. JavaScript Files Configuration (Non-Type-Aware)
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // 5. Jest/Test Files Configuration
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Relax some rules for test files
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },

  // 6. Prettier Config (must be last)
  prettierConfig,
];
