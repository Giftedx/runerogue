/**
 * Clean Jest Configuration for RuneRogue Phase 1A
 * Focus on core packages only, ignore external repos and archives
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Only test core packages
  projects: [
    {
      displayName: "osrs-data",
      testMatch: ["<rootDir>/packages/osrs-data/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/packages/osrs-data/src/$1",
      },
      collectCoverageFrom: [
        "packages/osrs-data/src/**/*.ts",
        "!packages/osrs-data/src/**/*.d.ts",
        "!packages/osrs-data/src/**/__tests__/**",
      ],
    },
    {
      displayName: "shared",
      testMatch: ["<rootDir>/packages/shared/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/packages/shared/src/$1",
      },
      collectCoverageFrom: [
        "packages/shared/src/**/*.ts",
        "!packages/shared/src/**/*.d.ts",
        "!packages/shared/src/**/__tests__/**",
      ],
    },
    {
      displayName: "game-server",
      testMatch: ["<rootDir>/packages/game-server/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/packages/game-server/src/$1",
      },
      collectCoverageFrom: [
        "packages/game-server/src/**/*.ts",
        "!packages/game-server/src/**/*.d.ts",
        "!packages/game-server/src/**/__tests__/**",
      ],
    },
  ],

  // Ignore external and problematic directories
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/coverage/",
    "/external-repos/",
    "/archives/",
    "/tools-python/",
    "/server-ts/", // Focus on packages/ first
    "/client/", // Handle client tests separately
  ],

  // Ignore problematic patterns
  watchPathIgnorePatterns: [
    "/external-repos/",
    "/archives/",
    "/tools-python/",
    "/dist/",
    "/build/",
  ],

  collectCoverageFrom: [
    "packages/*/src/**/*.{ts,js}",
    "!packages/*/src/**/*.d.ts",
    "!packages/*/src/**/*.test.ts",
    "!packages/*/src/**/*.spec.ts",
    "!packages/*/src/**/__tests__/**",
    "!packages/*/src/**/__mocks__/**",
    "!**/node_modules/**",
  ],

  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Simplified transform patterns
  transformIgnorePatterns: ["node_modules/(?!(p-limit|yocto-queue)/)"],

  verbose: true,
  maxWorkers: 1, // Prevent conflicts during cleanup
};
