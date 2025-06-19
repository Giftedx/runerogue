/**
 * Mock for p-limit to avoid ESM import issues in Jest
 */
export default function pLimit(_concurrency) {
  return async function (fn, ...args) {
    return await fn(...args);
  };
}
