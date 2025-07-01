import dotenv from 'dotenv';
import { join } from 'path';
import { createLogger } from '@monorepo/core';

const logger = createLogger({ serviceName: 'brand-context-mcp', defaultMeta: { component: 'environment-loader' } });

/**
 * Load environment variables from .env files
 * Looks for .env files in the current directory and root directory
 */
export function loadEnvironment(): void {
  try {
    // Try to load from current directory
    const localResult = dotenv.config();
    
    // Try to load from root directory if local load didn't find anything
    if (localResult.error) {
      const rootPath = join(process.cwd(), '../../.env');
      dotenv.config({ path: rootPath });
      logger.info('Loaded environment from root .env file');
    } else {
      logger.info('Loaded environment from local .env file');
    }
    
    // Check for required environment variables
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      const errorMessage = `Missing critical environment variables: ${missing.join(', ')}. Server cannot start.`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    logger.info('All required environment variables are present.');

  } catch (error: any) {
    // Log the original error if it's from dotenv or path resolution,
    // otherwise, it might be the error we just threw.
    if (error.message.startsWith('Missing critical environment variables')) {
        throw error; // Re-throw the specific error about missing vars
    }
    const loadErrorMessage = `Failed to load or validate environment variables: ${error.message}`;
    logger.error(loadErrorMessage, error);
    throw new Error(loadErrorMessage);
  }
}
