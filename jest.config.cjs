/**
 * @file Root Jest configuration for the RuneRogue monorepo.
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  coverageProvider: "v8",
  testMatch: [
    "<rootDir>/packages/game-server/src/tests/integration/combat.test.ts",
    "<rootDir>/packages/game-server/src/__tests__/**/*.test.ts",
    "<rootDir>/packages/game-server/src/**/__tests__/**/*.test.ts",
    "<rootDir>/packages/game-server/src/**/events/__tests__/**/*.test.ts",
  ],
  moduleNameMapper: {
    // Support both @runerogue/shared and @runerogue/shared/src/* imports
    "^@runerogue/shared$": "<rootDir>/packages/shared/src",
    "^@runerogue/shared/(.*)$": "<rootDir>/packages/shared/src/$1",
    "^@runerogue/osrs-data$": "<rootDir>/packages/osrs-data/src",
    "^@runerogue/osrs-data/(.*)$": "<rootDir>/packages/osrs-data/src/$1",
    "^@runerogue/game-server$": "<rootDir>/packages/game-server/src",
    "^@runerogue/game-server/(.*)$": "<rootDir>/packages/game-server/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(@colyseus/schema|colyseus.js))"],
  modulePathIgnorePatterns: ["<rootDir>/external-repos/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 20000,
  fakeTimers: {
    enableGlobally: true,
  },
};
