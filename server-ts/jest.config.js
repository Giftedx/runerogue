module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  verbose: true,
  testPathIgnorePatterns: ['<rootDir>/client/meta-ui/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/client/meta-ui/tests/e2e',
    '<rootDir>/client/meta-ui/__tests__',
    '<rootDir>/src/server/__tests__/__mocks__/@colyseus/colyseus.js/src/Connection.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 'es2018',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
      },
    },
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'es2018',
          module: 'commonjs',
        },
      },
    ],
  },
};
