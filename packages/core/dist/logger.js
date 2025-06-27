/**
 * Logger utility for the Multi-Brand AI Agent System
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Creates a brand-aware logger instance
 */
export function createLogger(brandId) {
    return {
        debug(message, context) {
            logMessage(LogLevel.DEBUG, message, brandId, context);
        },
        info(message, context) {
            logMessage(LogLevel.INFO, message, brandId, context);
        },
        warn(message, context) {
            logMessage(LogLevel.WARN, message, brandId, context);
        },
        error(message, context) {
            logMessage(LogLevel.ERROR, message, brandId, context);
        },
    };
}
/**
 * Core logging function
 */
function logMessage(level, message, brandId, context) {
    const logObj = {
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
//# sourceMappingURL=logger.js.map