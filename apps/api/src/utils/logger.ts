// Basic logger for apps/api
// For more advanced logging, consider integrating Winston like in brand-context MCP
// or enhancing the logger in @monorepo/core.

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

function log(level: LogLevel, message: string, context?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [API] [${level}] ${message}`;
  if (context !== undefined) {
    console.log(logMessage, context);
  } else {
    console.log(logMessage);
  }
}

export const logger = {
  debug: (message: string, context?: any) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: any) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: any) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: any) => log(LogLevel.ERROR, message, context),
};
