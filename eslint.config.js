// ESLint configuration for monorepo (ESLint v9+)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Base JavaScript configuration
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "writable",
        module: "writable",
        require: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        // Jest globals
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        test: "readonly",
        // Phaser & Colyseus globals
        Phaser: "readonly",
        Colyseus: "readonly",
        ColyseusClient: "readonly",
        SpriteGenerator: "readonly",
        CombatEffectsManager: "readonly",
        SpriteAnimationManager: "readonly",
        OSRSUIManager: "readonly",
      },
    },
  },

  // Prettier configuration
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // General TypeScript configuration
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Package-specific TypeScript configurations
  /*
  {
    files: [
      "client/src/**/*.ts",
      "client/src/**/*.tsx",
      "client/vite.config.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: ["./client/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["client/src/index.d.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./client/tsconfig.index.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "packages/game-server/src/**/*.ts",
      "packages/game-server/src/**/*.d.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: [
          "./packages/game-server/tsconfig.json",
          "./packages/game-server/tsconfig.d.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/game-server/src/__tests__/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./packages/game-server/src/__tests__/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/osrs-data/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./packages/osrs-data/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "packages/osrs-data/src/calculators/__tests__/**/*.ts",
      "packages/osrs-data/src/skills/__tests__/**/*.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: [
          "./packages/osrs-data/src/calculators/__tests__/tsconfig.json",
          "./packages/osrs-data/src/skills/__tests__/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "packages/phaser-client/src/**/*.ts",
      "packages/phaser-client/src/**/*.tsx",
    ],
    languageOptions: {
      parserOptions: {
        project: ["./packages/phaser-client/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "packages/server/src/**/*.ts",
      "packages/server/client/meta-ui/src/**/*.ts",
      "packages/server/client/meta-ui/src/**/*.tsx",
    ],
    languageOptions: {
      parserOptions: {
        project: [
          "./packages/server/tsconfig.json",
          "./packages/server/client/meta-ui/tsconfig.json",
          "./packages/server/client/meta-ui/src/types/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "packages/server/__tests__/**/*.ts",
      "packages/server/src/__tests__/**/*.ts",
      "packages/server/client/meta-ui/__tests__/**/*.tsx",
      "packages/server/client/meta-ui/tests/**/*.spec.ts",
      "packages/server/jest.setup.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: ["./packages/server/tsconfig.jest.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/shared/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./packages/shared/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/shared/src/__tests__/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./packages/shared/src/__tests__/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./scripts/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["./*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  */
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "archives/",
      "external-repos/",
      "client/archived-complex-files/",
      "packages/server/archived-tests-debug/",
      "**/*.log",
      "**/*.lock",
    ],
  }
);
