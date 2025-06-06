// RuneRogue Monorepo Jest Configuration
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'osrs-data',
      testMatch: ['<rootDir>/packages/osrs-data/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'game-engine',
      testMatch: ['<rootDir>/packages/game-engine/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'game-server',
      testMatch: ['<rootDir>/packages/game-server/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'discord-client',
      testMatch: ['<rootDir>/packages/discord-client/**/*.test.ts'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    // Legacy tests for existing server-ts
    {
      displayName: 'legacy',
      testMatch: ['<rootDir>/server-ts/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    }
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,js}',
    'server-ts/src/**/*.{ts,js}', // Legacy coverage
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/*.test.ts',
    '!packages/*/src/**/*.spec.ts',
    '!server-ts/src/**/*.d.ts',
    '!server-ts/src/**/__tests__/**',
    '!server-ts/src/**/__mocks__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/tools-python/',
    '/archives/',
    '\\.d\\.ts$'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server-ts/src/$1',
    '^@osrs-data/(.*)$': '<rootDir>/packages/osrs-data/src/$1',
    '^@game-engine/(.*)$': '<rootDir>/packages/game-engine/src/$1',
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1'
  }
};