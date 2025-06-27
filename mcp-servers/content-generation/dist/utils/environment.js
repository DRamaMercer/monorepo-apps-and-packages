import { z } from 'zod';
import dotenv from 'dotenv';
import logger from './logger';
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
export const environment = (() => {
    try {
        return environmentSchema.parse(process.env);
    }
    catch (error) {
        logger.error('Invalid environment variables:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=environment.js.map