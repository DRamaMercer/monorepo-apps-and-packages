import { z } from 'zod';
import dotenv from 'dotenv';
import { createLogger } from '@monorepo/core';

const logger = createLogger({ serviceName: 'content-generation-mcp', defaultMeta: { component: 'environment-loader' } });

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  // Add other environment variables specific to content generation
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string().optional(),
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
