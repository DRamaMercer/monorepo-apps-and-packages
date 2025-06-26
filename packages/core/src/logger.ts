/**
 * Logger utility for the Multi-Brand AI Agent System
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  brandId?: string;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Creates a brand-aware logger instance
 */
export function createLogger(brandId?: string): Logger {
  return {
    debug(message: string, context?: Record<string, unknown>) {
      logMessage(LogLevel.DEBUG, message, brandId, context);
    },
    info(message: string, context?: Record<string, unknown>) {
      logMessage(LogLevel.INFO, message, brandId, context);
    },
    warn(message: string, context?: Record<string, unknown>) {
      logMessage(LogLevel.WARN, message, brandId, context);
    },
    error(message: string, context?: Record<string, unknown>) {
      logMessage(LogLevel.ERROR, message, brandId, context);
    },
  };
}

/**
 * Core logging function
 */
function logMessage(
  level: LogLevel,
  message: string,
  brandId?: string,
  context?: Record<string, unknown>,
): void {
  const logObj: LogMessage = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(brandId && { brandId }),
    ...(context && { context }),
  };

  // Format the log message for console output
  let logPrefix = `[${logObj.timestamp}] [${logObj.level}]`;
  if (logObj.brandId) {
    logPrefix += ` [${logObj.brandId}]`;
  }

  // Output to console based on log level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`${logPrefix}: ${message}`, context || '');
      break;
    case LogLevel.INFO:
      console.info(`${logPrefix}: ${message}`, context || '');
      break;
    case LogLevel.WARN:
      console.warn(`${logPrefix}: ${message}`, context || '');
      break;
    case LogLevel.ERROR:
      console.error(`${logPrefix}: ${message}`, context || '');
      break;
  }

  // In a production environment, this could also send logs to a monitoring service
}

// Default logger instance
export const logger = createLogger();
