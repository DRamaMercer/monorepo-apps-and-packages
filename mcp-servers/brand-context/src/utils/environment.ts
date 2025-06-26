import dotenv from 'dotenv';
import { join } from 'path';
import { logger } from './logger';

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
      logger.warn(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
  } catch (error) {
    logger.error('Error loading environment variables:', error);
  }
}
