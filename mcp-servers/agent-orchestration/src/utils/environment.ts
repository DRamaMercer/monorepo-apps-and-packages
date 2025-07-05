import dotenv from 'dotenv';
import { createLogger } from '@monorepo/core';
import path from 'path';
import fs from 'fs';

const logger = createLogger({ serviceName: 'agent-orchestration-mcp', defaultMeta: { component: 'environment-loader' } });

/**
 * Loads environment variables from .env file
 * Checks different locations for the .env file
 */
export function loadEnvironment(): void {
  try {
    // Try to load from current directory
    let envResult = dotenv.config();
    
    // If no .env file in current directory, try to load from project root
    if (envResult.error) {
      const rootEnvPath = path.resolve(process.cwd(), '../../.env');
      if (fs.existsSync(rootEnvPath)) {
        envResult = dotenv.config({ path: rootEnvPath });
      }
    }

    if (envResult.error) {
      logger.warn('No .env file found, using environment variables');
    } else {
      logger.info('Environment variables loaded');
    }

    // Validate required environment variables
    const requiredEnvVars = [
      // Add any required environment variables here
      // Example: 'DATABASE_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      logger.warn(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
      );
    }
  } catch (error) {
    logger.error('Error loading environment variables:', error);
  }
}

/**
 * Gets a required environment variable
 * Throws an error if the variable is not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
