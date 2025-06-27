import { z } from 'zod';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001), // Different port for analytics server
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  // Add other environment variables specific to analytics
});

export type Environment = z.infer<typeof environmentSchema>;

export const environment: Environment = (() => {
  try {
    return environmentSchema.parse(process.env);
  } catch (error) {
    logger.error('Invalid environment variables:', error);
    process.exit(1);
  }
})();
