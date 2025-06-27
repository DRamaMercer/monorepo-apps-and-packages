/**
 * Utility functions for the Multi-Brand AI Agent System
 */
/**
 * Formats a brand ID to a display name
 */
export function formatBrandName(brandId) {
    return brandId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Validates if a brand ID is valid
 */
export function isValidBrandId(brandId) {
    const validBrands = ['saithavys', 'partly-office', 'g-prismo'];
    return validBrands.includes(brandId);
}
/**
 * Generates a unique ID
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=utils.js.map