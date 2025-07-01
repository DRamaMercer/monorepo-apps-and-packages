import { Hono } from 'hono';
import { z } from 'zod';
import { createLogger } from '@monorepo/core';
import { environment } from '../utils/environment';
import {

const logger = createLogger({ serviceName: 'content-generation-mcp', defaultMeta: { component: 'mcpServer' } });
  MCPTool,
  MCPResource,
  MCPService, // Changed from MCPServer
  ServerConfig, // New import
} from '@modelcontextprotocol/runtime';

// Define schemas for tools
const generateContentToolSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
});

const getContentStatusToolSchema = z.object({
  contentId: z.string().uuid(),
});

// Define schemas for resources
const contentResourceSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string(),
  generatedContent: z.string(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

class ContentGenerationService extends MCPService {
  constructor(app: Hono, config: ServerConfig) {
    super(app, config);
    // Removed redundant this.name, this.version, this.description assignments

    this.registerTools([
      new MCPTool({
        name: 'generate_content',
        description: 'Generates content based on a prompt using an AI model.',
        inputSchema: generateContentToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Generating content:', input.prompt);
          // Simulate AI content generation
          const contentId = 'gen-' + Math.random().toString(36).substring(2, 11);
          // In a real scenario, this would call an AI API (e.g., OpenAI, Anthropic)
          // and store the result or a reference to it in a database.
          // For now, simulate a delay and return dummy content.
          await new Promise(resolve => setTimeout(resolve, 2000));
          const generatedContent = `Generated content for: "${input.prompt}"`;
          
          return {
            contentId: contentId,
            generatedContent: generatedContent,
            status: 'completed',
          };
        },
      }),
      new MCPTool({
        name: 'get_content_status',
        description: 'Retrieves the status of a previously generated content request.',
        inputSchema: getContentStatusToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Getting content status for ID:', input.contentId);
          // Simulate fetching status from a database
          return {
            contentId: input.contentId,
            status: 'completed', // Always completed for simulation
            generatedContent: 'Simulated content',
          };
        },
      }),
    ]);

    this.registerResources([
      new MCPResource({
        name: 'content',
        description: 'Represents generated content.',
        schema: contentResourceSchema, // Added schema
        get: async (uri: string, context?: any) => { // Explicitly type uri
          logger.info('Fetching content resource for URI:', uri);
          const contentId = uri.split('/').pop();
          if (!contentId) {
            throw new Error('Invalid content URI');
          }
          return {
            id: contentId,
            prompt: 'Simulated prompt',
            generatedContent: 'This is simulated generated content.',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
        // Add other CRUD operations as needed: create, update, delete
      }),
    ]);

    logger.info(`Content Generation MCP Server initialized on port ${environment.PORT}`);
  }
}

/**
 * Create and configure the MCP server instance
 */
export async function createMCPServer(): Promise<Hono> {
  const app = new Hono();

  const config: ServerConfig = {
    name: 'content-generation',
    description: 'MCP Server for AI-powered content generation.',
    version: '1.0.0',
  };

  const contentGenerationService = new ContentGenerationService(app, config);
  await contentGenerationService.initialize(); // Call initialize on the service instance

  return app;
}
