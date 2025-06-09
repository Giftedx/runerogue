// Set up test environment
process.env.NODE_ENV = "test";

// Polyfill Symbol.metadata for Colyseus compatibility
if (!Symbol.metadata) {
  Symbol.metadata = Symbol("Symbol.metadata");
}

// Setup reflect-metadata
require("reflect-metadata");

// Mock console methods to reduce noise during tests (but allow errors)
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
