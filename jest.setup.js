// Set up test environment
process.env.NODE_ENV = "test";

// Polyfill Symbol.metadata for Colyseus compatibility
if (!Symbol.metadata) {
  Symbol.metadata = Symbol("Symbol.metadata");
}

// Setup reflect-metadata
require("reflect-metadata");

// Make Jest globals available
global.describe = describe;
global.it = it;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
