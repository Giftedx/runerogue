module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  verbose: true,
  testPathIgnorePatterns: ['<rootDir>/client/meta-ui/', '<rootDir>/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/client/meta-ui/tests/e2e',
    '<rootDir>/client/meta-ui/__tests__',
    '<rootDir>/src/server/__tests__/__mocks__/@colyseus/colyseus.js/src/Connection.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        isolatedModules: true,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
