import { Hono } from 'hono'; // Keep Hono import for type if needed, but not for app instance
import { serve } from '@hono/node-server';
// Removed: import { ServerConfig } from '@modelcontextprotocol/runtime'; // Not needed here
import { createMCPServer } from './mcp/server'; // Changed import
import logger from './utils/logger';
import { environment } from './utils/environment';

// Removed: const app = new Hono();
// Removed: const serverConfig: ServerConfig = { ... };
// Removed: new ContentGenerationService(app, serverConfig);

async function startContentGenerationServer() {
  try {
    logger.info('Starting Content Generation MCP Server...');

    // createMCPServer now returns the Hono app directly
    const app = await createMCPServer();

    // Start the server
    serve({
      fetch: app.fetch,
      port: environment.PORT,
    }, (info) => {
      logger.info(`Content Generation MCP Server listening on http://${info.address}:${info.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Content Generation MCP Server:', error);
    process.exit(1);
  }
}

startContentGenerationServer();
