module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/client/meta-ui/tests/e2e',
    '<rootDir>/src/server/__tests__/__mocks__/@colyseus/colyseus.js/src/Connection.ts',
  ],
};
