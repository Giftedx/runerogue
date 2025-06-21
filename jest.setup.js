// Set up test environment
process.env.NODE_ENV = "test";

// Polyfill Symbol.metadata for Colyseus compatibility
if (!Symbol.metadata) {
  Symbol.metadata = Symbol("Symbol.metadata");
}

// Setup reflect-metadata
require("reflect-metadata");
