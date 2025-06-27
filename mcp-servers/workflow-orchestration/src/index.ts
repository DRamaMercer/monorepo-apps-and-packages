import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { ServerConfig } from '@modelcontextprotocol/runtime';
import WorkflowOrchestrationService from './mcp/server';
import logger from './utils/logger';
import { environment } from './utils/environment';

const app = new Hono();

// MCP Server configuration
const serverConfig: ServerConfig = {
  port: environment.PORT,
  host: '0.0.0.0',
  // Add other necessary configurations like API keys, database connections, etc.
};

// Initialize the Workflow Orchestration MCP Service
new WorkflowOrchestrationService(app, serverConfig);

// Start the server
serve({
  fetch: app.fetch,
  port: environment.PORT,
}, (info) => {
  logger.info(`Workflow Orchestration MCP Server listening on http://${info.address}:${info.port}`);
});
