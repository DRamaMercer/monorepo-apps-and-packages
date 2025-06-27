/**
 * Utility functions for the Multi-Brand AI Agent System
 */
/**
 * Formats a brand ID to a display name
 */
export declare function formatBrandName(brandId: string): string;
/**
 * Validates if a brand ID is valid
 */
export declare function isValidBrandId(brandId: string): boolean;
/**
 * Generates a unique ID
 */
export declare function generateId(): string;
/**
 * Delays execution for a specified number of milliseconds
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Safely parses JSON with error handling
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
//# sourceMappingURL=utils.d.ts.map