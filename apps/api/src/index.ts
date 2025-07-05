import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger' // Renamed to avoid conflict
import { callMcpTool } from './utils/mcpUtils'
// Application specific logger is now from @monorepo/core
import { createLogger, DEFAULT_PORTS } from '@monorepo/core';
import type { Brand, BrandStatus } from '@monorepo/types'; // Assuming Brand type is needed

const appLogger = createLogger({ serviceName: 'api-service' });
const app = new Hono()

// Middleware
app.use('*', honoLogger())
app.use('*', cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(','),
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Multi-Brand AI Agent API'
  })
})

const BRAND_CONTEXT_MCP_URL = process.env.BRAND_CONTEXT_MCP_URL || 'http://localhost:3021';

// API routes
app.get('/api/brands', async (c) => {
  appLogger.info('Received request for /api/brands');
  try {
    const mcpResponse = await callMcpTool<any[]>( // Specify expected data type if known, e.g. BrandContext[]
      BRAND_CONTEXT_MCP_URL,
      'list_brand_contexts',
      { status: 'active' } // Example: Fetch only active brands
    );

    if (!mcpResponse.success || !mcpResponse.brandContexts) {
      appLogger.error('Failed to fetch brands from MCP or malformed response', mcpResponse);
      c.status(500);
      return c.json({ error: 'Failed to fetch brands', details: mcpResponse.error });
    }

    // Transform MCP brandContexts to the desired API output format
    // Assuming mcpResponse.brandContexts is an array of objects similar to BrandContext from @monorepo/types
    // but we might only want to expose parts of it, similar to the original mock.
    const brandsToReturn = mcpResponse.brandContexts.map((bc: any) => ({
      id: bc.slug, // Assuming slug is the desired public ID, or bc.id if it's UUID
      name: bc.name,
      description: bc.description,
      status: bc.metadata?.status || 'unknown' // Extract status from metadata if present
    }));

    return c.json({ brands: brandsToReturn });
  } catch (error: any) {
    appLogger.error('Error in /api/brands endpoint:', error);
    c.status(500);
    return c.json({ error: 'Internal server error', details: error.message });
  }
})

// Brand-specific endpoints
app.get('/api/brands/:brandId', async (c) => {
  const brandId = c.req.param('brandId');
  appLogger.info(`Received request for /api/brands/${brandId}`);

  if (!brandId) {
    c.status(400);
    return c.json({ error: 'Brand ID is required' });
  }

  try {
    // Attempt to fetch by slug first, then by ID if it looks like a UUID.
    // This heuristic might need refinement based on actual brandId format.
    // For now, we assume brandId parameter could be a slug.
    // The `get_brand_context` tool in brand-context-mcp supports fetching by slug or id.
    const mcpInput = { slug: brandId };
    // Alternatively, could try to detect if brandId is a UUID:
    // const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(brandId);
    // const mcpInput = isUuid ? { id: brandId } : { slug: brandId };


    const mcpResponse = await callMcpTool<any>( // Specify BrandContext type if available and consistent
      BRAND_CONTEXT_MCP_URL,
      'get_brand_context',
      mcpInput
    );

    if (!mcpResponse.success || !mcpResponse.brandContext) {
      appLogger.error(`Failed to fetch brand ${brandId} from MCP or malformed response`, mcpResponse);
      // Check if the error indicates "not found" specifically
      if (mcpResponse.error && mcpResponse.error.toLowerCase().includes('not found')) {
        c.status(404);
        return c.json({ error: 'Brand not found', details: mcpResponse.error });
      }
      c.status(500);
      return c.json({ error: 'Failed to fetch brand details', details: mcpResponse.error });
    }

    // Transform MCP brandContext to the desired API output format
    // This should align with the BrandContext type from @monorepo/types or a defined API contract
    const brandToReturn = {
      id: mcpResponse.brandContext.slug || mcpResponse.brandContext.id, // Prefer slug if available
      name: mcpResponse.brandContext.name,
      description: mcpResponse.brandContext.description,
      status: mcpResponse.brandContext.metadata?.status || 'unknown',
      // Include other relevant fields from mcpResponse.brandContext as needed
      // For example, voice, visual, contentGuidelines could be nested objects
      voice: mcpResponse.brandContext.voice,
      visual: mcpResponse.brandContext.visual,
      contentGuidelines: mcpResponse.brandContext.contentGuidelines,
      metadata: mcpResponse.brandContext.metadata,
    };

    return c.json(brandToReturn);
  } catch (error: any) {
    appLogger.error(`Error in /api/brands/${brandId} endpoint:`, error);
    c.status(500);
    return c.json({ error: 'Internal server error', details: error.message });
  }
})

import { getMcpServerInfo } from './utils/mcpUtils'; // Import the new utility

// MCP Server status endpoint
interface McpServerConfig {
  name: string;
  url: string;
}

app.get('/api/mcp/status', async (c) => {
  appLogger.info('Received request for /api/mcp/status');

  const mcpServerConfigJson = process.env.MCP_SERVER_CONFIG_JSON;
  let mcpServersToQuery: McpServerConfig[] = [];

  if (mcpServerConfigJson) {
    try {
      mcpServersToQuery = JSON.parse(mcpServerConfigJson);
    } catch (error: any) {
      appLogger.error('Failed to parse MCP_SERVER_CONFIG_JSON:', error);
      c.status(500);
      return c.json({ error: 'Invalid MCP server configuration', details: error.message });
    }
  } else {
    // Fallback to default/known MCP servers if config is not provided
    // These URLs should ideally also come from constants or more specific env vars
    // For now, using default ports from packages/core/constants.ts might be an option if accessible
    // Or define them here as fallbacks.
    appLogger.warn('MCP_SERVER_CONFIG_JSON not set, using fallback/hardcoded MCP server list for status check.');
    mcpServersToQuery = [
      { name: 'brand-context', url: BRAND_CONTEXT_MCP_URL }, // Already defined
      // Add other MCPs with their default URLs if known, e.g.:
      // { name: 'content-generation', url: process.env.CONTENT_GENERATION_MCP_URL || 'http://localhost:3003' },
      // { name: 'analytics', url: process.env.ANALYTICS_MCP_URL || 'http://localhost:3004' },
    ];
    // For simplicity in this refactor, we'll only query brand-context if no config is set.
    // A more robust solution would define all expected MCPs and their default URLs.
    if (mcpServersToQuery.length === 0 && BRAND_CONTEXT_MCP_URL) {
        mcpServersToQuery.push({ name: 'brand-context', url: BRAND_CONTEXT_MCP_URL});
    }
  }

  if (mcpServersToQuery.length === 0) {
    return c.json({ servers: [] });
  }

  const statusPromises = mcpServersToQuery.map(async (serverConfig) => {
    const infoResponse = await getMcpServerInfo(serverConfig.url);
    if (infoResponse.success && infoResponse.data) {
      return {
        name: infoResponse.data.name || serverConfig.name, // Prefer name from server info
        status: 'active', // Assuming if /mcp/info works, server is active
        version: infoResponse.data.version,
        description: infoResponse.data.description,
        url: serverConfig.url,
      };
    } else {
      return {
        name: serverConfig.name,
        status: 'unavailable',
        error: infoResponse.error,
        url: serverConfig.url,
      };
    }
  });

  try {
    const servers = await Promise.all(statusPromises);
    return c.json({ servers });
  } catch (error: any) {
    appLogger.error('Error fetching MCP server statuses:', error);
    c.status(500);
    return c.json({ error: 'Failed to fetch MCP server statuses', details: error.message });
  }
})

const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORTS.API;

console.log(`🚀 Multi-Brand AI Agent API Server starting on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
