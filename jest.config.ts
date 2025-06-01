import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

// Load environment variables from .env.test
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Verbosity and logging
  verbose: true,
  silent: false,
  detectOpenHandles: true,
  forceExit: true,
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: false, // Changed from true to false for better compatibility
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
  // Module resolution
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Test configuration
  testTimeout: 30000, // Increased from 15000
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/client/', '/services/'],
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Worker configuration
  maxWorkers: '50%', // Use half of available CPU cores
  maxConcurrency: 5, // Limit concurrent test runs
};

export default config;
