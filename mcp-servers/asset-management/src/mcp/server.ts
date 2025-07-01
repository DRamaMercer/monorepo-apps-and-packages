import { Hono } from 'hono';
import { z } from 'zod';
import { createLogger } from '@monorepo/core';
import { environment } from '../utils/environment';
import {

const logger = createLogger({ serviceName: 'asset-management-mcp', defaultMeta: { component: 'mcpServer' } });
  MCPTool,
  MCPResource,
  MCPService, // Changed from MCPServer
  ServerConfig, // New import
} from '@modelcontextprotocol/runtime';

// Define schemas for tools
const uploadAssetToolSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  data: z.string(), // Base64 encoded file data
});

const getAssetInfoToolSchema = z.object({
  assetId: z.string().uuid(),
});

const deleteAssetToolSchema = z.object({
  assetId: z.string().uuid(),
});

// Define schemas for resources
const assetResourceSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().int().positive(),
  url: z.string().url(),
  uploadedAt: z.string().datetime(),
});

class AssetManagementService extends MCPService {
  constructor(app: Hono, config: ServerConfig) {
    super(app, config);
    // Removed redundant this.name, this.version, this.description assignments

    this.registerTools([
      new MCPTool({
        name: 'upload_asset',
        description: 'Uploads a new digital asset.',
        inputSchema: uploadAssetToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Uploading asset:', input.fileName, input.fileType);
          // In a real scenario, this would upload to cloud storage (e.g., S3, Cloudinary)
          const assetId = `asset-${Date.now()}`;
          const assetUrl = `http://example.com/assets/${assetId}/${input.fileName}`;
          return { assetId, assetUrl, success: true };
        },
      }),
      new MCPTool({
        name: 'get_asset_info',
        description: 'Retrieves information about a specific digital asset.',
        inputSchema: getAssetInfoToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Getting asset info for ID:', input.assetId);
          // Simulate fetching asset info from a database
          return {
            id: input.assetId,
            fileName: 'simulated-file.jpg',
            fileType: 'image/jpeg',
            fileSize: 102400,
            url: `http://example.com/assets/${input.assetId}/simulated-file.jpg`,
            uploadedAt: new Date().toISOString(),
          };
        },
      }),
      new MCPTool({
        name: 'delete_asset',
        description: 'Deletes a digital asset.',
        inputSchema: deleteAssetToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Deleting asset with ID:', input.assetId);
          // Simulate deleting asset from storage
          return { assetId: input.assetId, success: true };
        },
      }),
    ]);

    this.registerResources([
      new MCPResource({
        name: 'asset',
        description: 'Represents a digital asset.',
        schema: assetResourceSchema, // Added schema
        get: async (uri: string, context?: any) => { // Explicitly type uri
          logger.info('Fetching asset resource for URI:', uri);
          const assetId = uri.split('/').pop();
          if (!assetId) {
            throw new Error('Invalid asset URI');
          }
          return {
            id: assetId,
            fileName: 'simulated-fetched-file.png',
            fileType: 'image/png',
            fileSize: 51200,
            url: `http://example.com/assets/${assetId}/simulated-fetched-file.png`,
            uploadedAt: new Date().toISOString(),
          };
        },
      }),
    ]);

    logger.info(`Asset Management MCP Server initialized on port ${environment.PORT}`);
  }
}

/**
 * Create and configure the MCP server instance
 */
export async function createMCPServer(): Promise<Hono> {
  const app = new Hono();

  const config: ServerConfig = {
    name: 'asset-management',
    description: 'MCP Server for managing digital assets (upload, retrieve, delete).',
    version: '1.0.0',
  };

  const assetManagementService = new AssetManagementService(app, config);
  await assetManagementService.initialize(); // Call initialize on the service instance

  return app;
}
