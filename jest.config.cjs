/**
 * @file Root Jest configuration for the RuneRogue monorepo.
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  // A preset that is used as a base for Jest's configuration
  // preset: "ts-jest",

  // The test environment that will be used for testing
  testEnvironment: "node",

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/packages", "<rootDir>/phaser-client"],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ["/node_modules/(?!(@colyseus/schema|colyseus.js))"],

  // Configuration for Jest projects
  projects: [
    {
      displayName: "phaser-client",
      testMatch: ["<rootDir>/phaser-client/src/**/*.test.ts"],
      testEnvironment: "jsdom",
      preset: "ts-jest",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/phaser-client/src/$1",
      },
    },
    {
      displayName: "game-server",
      testMatch: ["<rootDir>/packages/game-server/src/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest/presets/default-esm",
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true,
            tsconfig: "tsconfig.test.json",
          },
        ],
      },
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      transformIgnorePatterns: [],
      moduleNameMapper: {
        "^@runerogue/shared$": "<rootDir>/packages/shared/src",
        "^@runerogue/osrs-data$": "<rootDir>/packages/osrs-data/src",
        "^@runerogue/game-server(.*)$": "<rootDir>/packages/game-server/src$1",
      },
    },
    {
      displayName: "server",
      testMatch: ["<rootDir>/packages/server/src/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      moduleNameMapper: {
        "^@runerogue/shared$": "<rootDir>/packages/shared/src",
        "^@runerogue/osrs-data$": "<rootDir>/packages/osrs-data/src",
      },
    },
    {
      displayName: "shared",
      testMatch: ["<rootDir>/packages/shared/src/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
    },
    {
      displayName: "osrs-data",
      testMatch: ["<rootDir>/packages/osrs-data/src/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
    },
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // The paths to modules that run some code to configure or set up the testing environment before each test
  // setupFiles: [],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    "^@runerogue/server(.*)$": "<rootDir>/packages/server/src$1",
    "^@runerogue/shared(.*)$": "<rootDir>/packages/shared/src$1",
    "^@runerogue/osrs-data(.*)$": "<rootDir>/packages/osrs-data/src$1",
    "^@runerogue/game-server(.*)$": "<rootDir>/packages/game-server/src$1",
    "^@runerogue/phaser-client(.*)$": "<rootDir>/phaser-client/src$1",
  },

  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
  ],
};
