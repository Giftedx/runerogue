import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// Add colors to winston
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format for console logging
// Custom replacer to handle circular references in JSON.stringify
const jsonReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

// Format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length) log += `\n${JSON.stringify(meta, jsonReplacer(), 2)}`;
    return log;
  })
);

// Create transports based on environment
const createTransports = () => {
  const transportList: winston.transport[] = [
    // Console transport for all environments
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    transportList.push(
      // Daily rotate file for all logs
      new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
      }),
      // Error logs
      new winston.transports.File({
        level: 'error',
        filename: path.join(logDir, 'error.log'),
        format: fileFormat,
      })
    );
  }

  return transportList;
};

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  defaultMeta: { service: 'runerogue' },
  transports: createTransports(),
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

// Create a stream for morgan (HTTP request logging)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error(
    'Unhandled Rejection at:',
    JSON.parse(JSON.stringify({ promise, reason }, jsonReplacer()))
  );
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

export default logger;
