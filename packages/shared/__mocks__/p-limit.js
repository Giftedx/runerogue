/**
 * Mock for p-limit module to resolve Jest ESM compatibility issues
 * This provides a CommonJS-compatible version for testing
 */
const pLimit = (concurrency) => {
  return (fn, ...args) => {
    return Promise.resolve(fn(...args));
  };
};

pLimit.default = pLimit;

module.exports = pLimit;
