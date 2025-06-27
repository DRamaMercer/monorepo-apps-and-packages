import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { ServerConfig } from '@modelcontextprotocol/runtime';
import AssetManagementService from './mcp/server';
import logger from './utils/logger';
import { environment } from './utils/environment';

const app = new Hono();

// MCP Server configuration
const serverConfig: ServerConfig = {
  port: environment.PORT,
  host: '0.0.0.0',
  // Add other necessary configurations like API keys, database connections, etc.
};

// Initialize the Asset Management MCP Service
new AssetManagementService(app, serverConfig);

// Start the server
serve({
  fetch: app.fetch,
  port: environment.PORT,
}, (info) => {
  logger.info(`Asset Management MCP Server listening on http://${info.address}:${info.port}`);
});
