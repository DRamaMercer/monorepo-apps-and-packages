import winston from 'winston';

// Allowed log levels, aligning with Winston's defaults
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Determine log format from environment variable, default based on NODE_ENV
const LOG_FORMAT = process.env.LOG_FORMAT || (process.env.NODE_ENV === 'production' ? 'json' : 'console');
// Determine log level from environment variable, default to 'info'
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export interface CreateLoggerOptions {
  serviceName: string;
  brandId?: string;
  defaultMeta?: Record<string, any>; // Allows passing additional default metadata
}

export function createLogger(options: CreateLoggerOptions): winston.Logger {
  const { serviceName, brandId, defaultMeta = {} } = options;

  // Combine provided defaultMeta with serviceName and brandId
  const combinedDefaultMeta: Record<string, any> = {
    service: serviceName,
    ...defaultMeta,
  };
  if (brandId) {
    combinedDefaultMeta.brandId = brandId;
  }

  // Define console log format
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service, brandId: bId, stack, ...meta }) => {
      let log = `${timestamp} [${service}${bId ? `:${bId}` : ''}] ${level}: ${message}`;

      // Filter out defaultMeta fields from the 'meta' object to avoid duplication
      const metaToLog = { ...meta };
      delete metaToLog.service; // service is already in combinedDefaultMeta
      if (bId) delete metaToLog.brandId; // brandId is already in combinedDefaultMeta or part of log string

      // Append remaining meta data if any
      if (Object.keys(metaToLog).length > 0 && Object.keys(metaToLog).filter(k => metaToLog[k] !== undefined).length > 0) {
        // Remove 'splat' if it's an empty array or object, as it's often added by Winston
        if (metaToLog.splat && Array.isArray(metaToLog.splat) && metaToLog.splat.length === 0) {
            delete metaToLog.splat;
        } else if (metaToLog.splat && typeof metaToLog.splat === 'object' && Object.keys(metaToLog.splat).length === 0) {
            delete metaToLog.splat;
        }
        if (Object.keys(metaToLog).length > 0) {
             log += ` ${JSON.stringify(metaToLog)}`;
        }
      }

      if (stack) {
        log += `\n${stack}`;
      }
      return log;
    })
  );

  // Define JSON log format
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Log stack trace for errors
    winston.format.splat(), // Properly handles multiple arguments to log methods
    winston.format.json()
  );

  return winston.createLogger({
    level: CURRENT_LOG_LEVEL,
    levels: LOG_LEVELS,
    format: LOG_FORMAT === 'json' ? jsonFormat : consoleFormat,
    defaultMeta: combinedDefaultMeta, // Metadata to be added to all logs from this logger instance
    transports: [
      new winston.transports.Console(),
    ],
    exceptionHandlers: [ // Optional: Log unhandled exceptions
        new winston.transports.Console({ format: LOG_FORMAT === 'json' ? jsonFormat : consoleFormat })
    ],
    rejectionHandlers: [ // Optional: Log unhandled promise rejections
        new winston.transports.Console({ format: LOG_FORMAT === 'json' ? jsonFormat : consoleFormat })
    ]
  });
}

// It's recommended that consumers import createLogger and instantiate their own logger
// specific to their service/module.
// Example:
// import { createLogger } from '@monorepo/core';
// const logger = createLogger({ serviceName: 'my-service' });
// logger.info('Hello world');

// The old Logger interface and LogLevel enum might not be needed
// if consumers directly use winston.Logger type.
// For compatibility, they can be kept or adapted.
// Keeping simplified versions or removing them if winston.Logger is directly exposed.

export type Logger = winston.Logger; // Consumers can use Winston's Logger type directly

// LogLevel enum can still be useful for consistency if needed elsewhere,
// but Winston uses string levels like 'info', 'warn', etc.
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}
