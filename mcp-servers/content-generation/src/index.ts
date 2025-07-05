import { Hono } from 'hono'; // Keep Hono import for type if needed, but not for app instance
import { serve } from '@hono/node-server';
// Removed: import { ServerConfig } from '@modelcontextprotocol/runtime'; // Not needed here
import { createMCPServer } from './mcp/server'; // Changed import
import { createLogger, DEFAULT_PORTS } from '@monorepo/core';
import { environment } from './utils/environment';

const logger = createLogger({ serviceName: 'content-generation-mcp' });

// Removed: const app = new Hono();
// Removed: const serverConfig: ServerConfig = { ... };
// Removed: new ContentGenerationService(app, serverConfig);

async function startContentGenerationServer() {
  try {
    logger.info('Starting Content Generation MCP Server...');

    // Pass the main service logger to createMCPServer
    const app = await createMCPServer(logger);

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
