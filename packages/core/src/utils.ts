/**
 * Utility functions for the Multi-Brand AI Agent System
 */

/**
 * Formats a brand ID to a display name
 */
export function formatBrandName(brandId: string): string {
  return brandId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Validates if a brand ID is valid
 */
export function isValidBrandId(brandId: string): boolean {
  const validBrands = ['saithavys', 'partly-office', 'g-prismo']
  return validBrands.includes(brandId)
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}
