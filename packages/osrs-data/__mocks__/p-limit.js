/**
 * Mock for p-limit to avoid ESM import issues in Jest
 */
module.exports = function pLimit(concurrency = 1) {
  return async function (fn, ...args) {
    return await fn(...args);
  };
};

module.exports.default = module.exports;
