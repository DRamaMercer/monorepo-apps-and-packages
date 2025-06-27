/**
 * Logger utility for the Multi-Brand AI Agent System
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
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
export declare function createLogger(brandId?: string): Logger;
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map