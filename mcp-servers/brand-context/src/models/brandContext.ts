import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Brand Context Model - defines the schema for brand configuration
 */
export const BrandContextSchema = z.object({
  // Brand identity
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  
  // Brand voice and tone
  voice: z.object({
    tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'playful', 'serious']),
    personality: z.array(z.string()),
    audience: z.array(z.string()),
    style: z.array(z.string()),
    vocabulary: z.object({
      preferredTerms: z.record(z.string()).optional(),
      avoidedTerms: z.record(z.string()).optional(),
    }).optional(),
  }),
  
  // Visual identity
  visual: z.object({
    colors: z.object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }),
    typography: z.object({
      primaryFont: z.string(),
      secondaryFont: z.string().optional(),
      headingFont: z.string().optional(),
    }).optional(),
    logo: z.object({
      primary: z.string().url(),
      secondary: z.string().url().optional(),
      favicon: z.string().url().optional(),
    }).optional(),
  }).optional(),
  
  // Content guidelines
  contentGuidelines: z.object({
    maxHeadingLength: z.number().int().positive().optional(),
    paragraphStyle: z.enum(['short', 'medium', 'long']).optional(),
    preferredFormats: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    tonalRules: z.array(z.string()).optional(),
  }).optional(),
  
  // Metadata
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number().int().positive(),
    status: z.enum(['active', 'draft', 'archived']),
  }),
});

// Export the TypeScript type derived from the schema
export type BrandContext = z.infer<typeof BrandContextSchema>;

/**
 * Create a new brand context
 */
export function createBrandContext(data: Omit<BrandContext, 'metadata'> & { status?: 'active' | 'draft' | 'archived' }): BrandContext {
  const now = new Date().toISOString();
  
  const brandContext: BrandContext = {
    ...data,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: data.status || 'draft'
    }
  };
  
  // Validate the brand context against the schema
  try {
    BrandContextSchema.parse(brandContext);
    return brandContext;
  } catch (error) {
    logger.error('Invalid brand context:', error);
    throw new Error('Failed to create brand context: validation error');
  }
}

/**
 * Update an existing brand context
 */
export function updateBrandContext(
  existing: BrandContext, 
  updates: Partial<Omit<BrandContext, 'id' | 'metadata'>>
): BrandContext {
  const updated: BrandContext = {
    ...existing,
    ...updates,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
      version: existing.metadata.version + 1
    }
  };
  
  // Validate the updated brand context against the schema
  try {
    BrandContextSchema.parse(updated);
    return updated;
  } catch (error) {
    logger.error('Invalid brand context update:', error);
    throw new Error('Failed to update brand context: validation error');
  }
}
