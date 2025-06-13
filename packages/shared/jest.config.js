/**
 * Jest configuration for @runerogue/shared package
 * Handles ESM compatibility issues and transforms ES modules
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
  ],
  // Transform ES modules that Jest can't handle natively
  transformIgnorePatterns: ["node_modules/(?!(p-limit|yocto-queue)/)"],
  // Mock ES modules that cause issues
  moduleNameMapper: {
    "^p-limit$": "<rootDir>/__mocks__/p-limit.js",
  },
};
