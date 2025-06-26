import { 
  MCPServer, 
  createServer, 
  MCPTool, 
  MCPResource 
} from '@modelcontextprotocol/runtime';
import { logger } from '../utils/logger';
import { BrandContext, BrandContextSchema, createBrandContext, updateBrandContext } from '../models/brandContext';
import { BrandContextDB } from '../models/supabaseClient';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create and configure the Brand Context MCP server instance
 */
export async function createMCPServer(): Promise<MCPServer> {
  // Create the MCP server
  const server = createServer({
    name: 'brand-context',
    description: 'Brand Context MCP Server for multi-brand system',
    version: '0.1.0',
  });

  // Define tools
  
  // 1. Get Brand Context Tool
  const getBrandContextTool: MCPTool = {
    name: 'get_brand_context',
    description: 'Get a brand context by ID or slug',
    inputSchema: z.object({
      id: z.string().uuid().optional().describe('The UUID of the brand context to retrieve'),
      slug: z.string().optional().describe('The slug of the brand context to retrieve')
    }).refine(data => data.id || data.slug, {
      message: 'Either id or slug must be provided'
    }),
    handler: async (input) => {
      logger.info(`Fetching brand context with ${input.id ? `ID ${input.id}` : `slug ${input.slug}`}`);
      
      let brandContext: BrandContext | null = null;
      
      if (input.id) {
        brandContext = await BrandContextDB.getById(input.id);
      } else if (input.slug) {
        brandContext = await BrandContextDB.getBySlug(input.slug);
      }
      
      if (!brandContext) {
        return {
          success: false,
          error: `Brand context not found with ${input.id ? `ID ${input.id}` : `slug ${input.slug}`}`
        };
      }
      
      return {
        success: true,
        brandContext
      };
    }
  };
  
  // 2. List Brand Contexts Tool
  const listBrandContextsTool: MCPTool = {
    name: 'list_brand_contexts',
    description: 'List all brand contexts, optionally filtered by status',
    inputSchema: z.object({
      status: z.enum(['active', 'draft', 'archived']).optional().describe('Filter by brand context status')
    }),
    handler: async (input) => {
      logger.info(`Listing brand contexts ${input.status ? `with status: ${input.status}` : ''}`);
      
      const brandContexts = await BrandContextDB.listAll(input.status);
      
      return {
        success: true,
        count: brandContexts.length,
        brandContexts
      };
    }
  };
  
  // 3. Create Brand Context Tool
  const createBrandContextTool: MCPTool = {
    name: 'create_brand_context',
    description: 'Create a new brand context',
    inputSchema: z.object({
      name: z.string().min(1).describe('Brand name'),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/).describe('URL-friendly slug for the brand'),
      description: z.string().optional().describe('Brand description'),
      voice: z.object({
        tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'playful', 'serious']).describe('Brand tone of voice'),
        personality: z.array(z.string()).describe('Brand personality traits'),
        audience: z.array(z.string()).describe('Target audience characteristics'),
        style: z.array(z.string()).describe('Writing style guidelines'),
        vocabulary: z.object({
          preferredTerms: z.record(z.string()).optional().describe('Terms to use (term: reason)'),
          avoidedTerms: z.record(z.string()).optional().describe('Terms to avoid (term: reason)')
        }).optional().describe('Vocabulary guidelines')
      }).describe('Brand voice and tone guidelines'),
      visual: z.object({
        colors: z.object({
          primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Primary brand color (hex)'),
          secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Secondary brand color (hex)'),
          accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Accent color (hex)'),
          text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Text color (hex)'),
          background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Background color (hex)')
        }).describe('Brand colors'),
        typography: z.object({
          primaryFont: z.string().describe('Primary font family'),
          secondaryFont: z.string().optional().describe('Secondary font family'),
          headingFont: z.string().optional().describe('Heading font family')
        }).optional().describe('Typography guidelines'),
        logo: z.object({
          primary: z.string().url().describe('Primary logo URL'),
          secondary: z.string().url().optional().describe('Secondary/alternate logo URL'),
          favicon: z.string().url().optional().describe('Favicon URL')
        }).optional().describe('Brand logos')
      }).optional().describe('Visual identity guidelines'),
      contentGuidelines: z.object({
        maxHeadingLength: z.number().int().positive().optional().describe('Maximum heading length'),
        paragraphStyle: z.enum(['short', 'medium', 'long']).optional().describe('Preferred paragraph length'),
        preferredFormats: z.array(z.string()).optional().describe('Preferred content formats'),
        contentTypes: z.array(z.string()).optional().describe('Content types for this brand'),
        tonalRules: z.array(z.string()).optional().describe('Specific tonal rules to follow')
      }).optional().describe('Content creation guidelines'),
      status: z.enum(['active', 'draft', 'archived']).optional().describe('Initial status (default: draft)')
    }),
    handler: async (input) => {
      logger.info(`Creating new brand context: ${input.name} (${input.slug})`);
      
      try {
        // Check if slug already exists
        const existing = await BrandContextDB.getBySlug(input.slug);
        if (existing) {
          return {
            success: false,
            error: `Brand context with slug "${input.slug}" already exists`
          };
        }
        
        // Create brand context with generated UUID
        const brandContextData = {
          id: uuidv4(),
          ...input
        };
        
        // Create and validate brand context
        const brandContext = createBrandContext(brandContextData);
        
        // Save to database
        const savedBrandContext = await BrandContextDB.create(brandContext);
        
        if (!savedBrandContext) {
          return {
            success: false,
            error: 'Failed to save brand context to database'
          };
        }
        
        return {
          success: true,
          brandContext: savedBrandContext
        };
      } catch (error) {
        logger.error('Error creating brand context:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error creating brand context'
        };
      }
    }
  };
  
  // 4. Update Brand Context Tool
  const updateBrandContextTool: MCPTool = {
    name: 'update_brand_context',
    description: 'Update an existing brand context',
    inputSchema: z.object({
      id: z.string().uuid().describe('The UUID of the brand context to update'),
      updates: z.object({
        name: z.string().min(1).optional().describe('Brand name'),
        description: z.string().optional().describe('Brand description'),
        voice: z.object({
          tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'playful', 'serious']).optional().describe('Brand tone of voice'),
          personality: z.array(z.string()).optional().describe('Brand personality traits'),
          audience: z.array(z.string()).optional().describe('Target audience characteristics'),
          style: z.array(z.string()).optional().describe('Writing style guidelines'),
          vocabulary: z.object({
            preferredTerms: z.record(z.string()).optional().describe('Terms to use'),
            avoidedTerms: z.record(z.string()).optional().describe('Terms to avoid')
          }).optional().describe('Vocabulary guidelines')
        }).optional().describe('Brand voice and tone guidelines'),
        visual: z.object({
          colors: z.object({
            primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Primary brand color (hex)'),
            secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Secondary brand color (hex)'),
            accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Accent color (hex)'),
            text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Text color (hex)'),
            background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Background color (hex)')
          }).optional().describe('Brand colors'),
          typography: z.object({
            primaryFont: z.string().optional().describe('Primary font family'),
            secondaryFont: z.string().optional().describe('Secondary font family'),
            headingFont: z.string().optional().describe('Heading font family')
          }).optional().describe('Typography guidelines'),
          logo: z.object({
            primary: z.string().url().optional().describe('Primary logo URL'),
            secondary: z.string().url().optional().describe('Secondary/alternate logo URL'),
            favicon: z.string().url().optional().describe('Favicon URL')
          }).optional().describe('Brand logos')
        }).optional().describe('Visual identity guidelines'),
        contentGuidelines: z.object({
          maxHeadingLength: z.number().int().positive().optional().describe('Maximum heading length'),
          paragraphStyle: z.enum(['short', 'medium', 'long']).optional().describe('Preferred paragraph length'),
          preferredFormats: z.array(z.string()).optional().describe('Preferred content formats'),
          contentTypes: z.array(z.string()).optional().describe('Content types for this brand'),
          tonalRules: z.array(z.string()).optional().describe('Specific tonal rules to follow')
        }).optional().describe('Content creation guidelines'),
        status: z.enum(['active', 'draft', 'archived']).optional().describe('Status update')
      }).describe('Updates to apply to the brand context')
    }),
    handler: async (input) => {
      logger.info(`Updating brand context with ID ${input.id}`);
      
      try {
        // Get existing brand context
        const existingBrandContext = await BrandContextDB.getById(input.id);
        
        if (!existingBrandContext) {
          return {
            success: false,
            error: `Brand context with ID ${input.id} not found`
          };
        }
        
        // Update brand context
        const updatedBrandContext = updateBrandContext(existingBrandContext, input.updates);
        
        // Save to database
        const savedBrandContext = await BrandContextDB.update(input.id, updatedBrandContext);
        
        if (!savedBrandContext) {
          return {
            success: false,
            error: 'Failed to save updated brand context to database'
          };
        }
        
        return {
          success: true,
          brandContext: savedBrandContext
        };
      } catch (error) {
        logger.error(`Error updating brand context with ID ${input.id}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error updating brand context'
        };
      }
    }
  };
  
  // 5. Delete Brand Context Tool
  const deleteBrandContextTool: MCPTool = {
    name: 'delete_brand_context',
    description: 'Delete a brand context',
    inputSchema: z.object({
      id: z.string().uuid().describe('The UUID of the brand context to delete')
    }),
    handler: async (input) => {
      logger.info(`Deleting brand context with ID ${input.id}`);
      
      // Check if brand context exists
      const existing = await BrandContextDB.getById(input.id);
      
      if (!existing) {
        return {
          success: false,
          error: `Brand context with ID ${input.id} not found`
        };
      }
      
      // Delete from database
      const deleted = await BrandContextDB.delete(input.id);
      
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete brand context from database'
        };
      }
      
      return {
        success: true,
        message: `Brand context ${existing.name} (${existing.slug}) successfully deleted`
      };
    }
  };
  
  // 6. Validate Content Against Brand Guidelines
  const validateContentTool: MCPTool = {
    name: 'validate_content',
    description: 'Validate content against brand guidelines',
    inputSchema: z.object({
      brandId: z.string().uuid().describe('The UUID of the brand context to validate against'),
      content: z.string().describe('The content to validate'),
      contentType: z.string().optional().describe('The type of content (e.g., blog, social, email)')
    }),
    handler: async (input) => {
      logger.info(`Validating content against brand with ID ${input.brandId}`);
      
      // Get brand context
      const brandContext = await BrandContextDB.getById(input.brandId);
      
      if (!brandContext) {
        return {
          success: false,
          error: `Brand context with ID ${input.brandId} not found`
        };
      }
      
      // In a real implementation, this would perform sophisticated validation
      // For now, we'll do some basic checks
      
      const validationResults = {
        passed: true,
        issues: [] as string[],
        warnings: [] as string[],
        stats: {
          wordCount: input.content.split(/\s+/).length,
          sentenceCount: input.content.split(/[.!?]+/).length - 1,
          avgSentenceLength: 0
        }
      };
      
      // Calculate average sentence length
      const sentences = input.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 0) {
        const totalWords = sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0);
        validationResults.stats.avgSentenceLength = totalWords / sentences.length;
      }
      
      // Check for avoided terms
      if (brandContext.voice.vocabulary?.avoidedTerms) {
        Object.keys(brandContext.voice.vocabulary.avoidedTerms).forEach(term => {
          const reason = brandContext.voice.vocabulary?.avoidedTerms?.[term];
          if (input.content.toLowerCase().includes(term.toLowerCase())) {
            validationResults.issues.push(`Contains avoided term "${term}": ${reason}`);
            validationResults.passed = false;
          }
        });
      }
      
      // Check paragraph style
      if (brandContext.contentGuidelines?.paragraphStyle) {
        const paragraphs = input.content.split(/\n\s*\n/);
        const longParagraphThreshold = 100;
        const shortParagraphThreshold = 30;
        
        paragraphs.forEach((paragraph, index) => {
          const wordCount = paragraph.split(/\s+/).length;
          
          if (brandContext.contentGuidelines?.paragraphStyle === 'short' && wordCount > shortParagraphThreshold) {
            validationResults.warnings.push(`Paragraph ${index + 1} is longer than recommended (${wordCount} words)`);
          } else if (brandContext.contentGuidelines?.paragraphStyle === 'medium' && wordCount > longParagraphThreshold) {
            validationResults.warnings.push(`Paragraph ${index + 1} is longer than recommended (${wordCount} words)`);
          }
        });
      }
      
      // Check for tone and style validation
      // In a real implementation, this might use an AI model to evaluate tone
      
      return {
        success: true,
        brandName: brandContext.name,
        validationResults
      };
    }
  };
  
  // Register tools
  server.registerTool(getBrandContextTool);
  server.registerTool(listBrandContextsTool);
  server.registerTool(createBrandContextTool);
  server.registerTool(updateBrandContextTool);
  server.registerTool(deleteBrandContextTool);
  server.registerTool(validateContentTool);
  
  // Define resources
  
  // 1. Active Brands Resource - provides list of active brands
  const activeBrandsResource: MCPResource = {
    name: 'active_brands',
    description: 'List of all active brands',
    handler: async () => {
      const activeBrands = await BrandContextDB.listAll('active');
      
      return {
        count: activeBrands.length,
        brands: activeBrands.map(brand => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description
        }))
      };
    }
  };
  
  // 2. Brand Schema Resource - provides the brand context schema
  const brandSchemaResource: MCPResource = {
    name: 'brand_schema',
    description: 'The schema for brand context configuration',
    handler: async () => {
      return {
        schema: BrandContextSchema.describe()
      };
    }
  };
  
  // Register resources
  server.registerResource(activeBrandsResource);
  server.registerResource(brandSchemaResource);
  
  logger.info('Brand Context MCP Server created with tools and resources');
  
  return server;
}
