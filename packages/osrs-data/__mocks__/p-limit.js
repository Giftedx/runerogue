// Mock for p-limit to avoid ESM issues in Jest
module.exports = function pLimit(concurrency) {
  return function (fn, ...args) {
    return Promise.resolve(fn(...args));
  };
};
