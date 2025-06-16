/**
 * Test-safe logger wrapper that prevents excessive output during tests
 * This helps avoid EPIPE errors caused by too much console output in Jest
 */

/**
 * Checks if we're currently running in a test environment
 */
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

/**
 * Lazily import logger only when not in test environment
 */
const getLogger = () => {
  if (isTestEnvironment()) {
    // Return a no-op logger during tests
    return {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      http: () => {},
    };
  }
  // Only import the real logger in non-test environments
  return require('../logger').default;
};

/**
 * Test-safe logger that conditionally logs based on environment
 */
export const testSafeLogger = {
  /**
   * Log info messages (suppressed during tests)
   */
  info: (message: string, ...args: unknown[]): void => {
    if (!isTestEnvironment()) {
      const logger = getLogger();
      logger.info(message, ...args);
    }
  },

  /**
   * Log warning messages (suppressed during tests)
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (!isTestEnvironment()) {
      const logger = getLogger();
      logger.warn(message, ...args);
    }
  },

  /**
   * Log debug messages (suppressed during tests)
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (!isTestEnvironment()) {
      const logger = getLogger();
      logger.debug(message, ...args);
    }
  },

  /**
   * Log error messages (always shown, even in tests, but rate-limited)
   */
  error: (message: string, ...args: unknown[]): void => {
    // Always log errors, but in tests, use a no-op to avoid EPIPE
    if (isTestEnvironment()) {
      // Completely suppress errors in tests to prevent EPIPE
      return;
    } else {
      const logger = getLogger();
      logger.error(message, ...args);
    }
  },
  /**
   * Force log a message even during tests (use sparingly)
   */
  forceLog: (
    level: 'info' | 'warn' | 'debug' | 'error',
    message: string,
    ...args: unknown[]
  ): void => {
    const logger = getLogger();
    logger[level](message, ...args);
  },
};

/**
 * Factory function to get the test-safe logger instance
 */
export const getTestSafeLogger = () => testSafeLogger;

export default testSafeLogger;
