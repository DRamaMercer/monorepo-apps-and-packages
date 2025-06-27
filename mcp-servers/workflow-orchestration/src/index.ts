import { Hono } from 'hono'; // Keep Hono import for type if needed, but not for app instance
import { serve } from '@hono/node-server';
// Removed: import { ServerConfig } from '@modelcontextprotocol/runtime'; // Not needed here
import { createMCPServer } from './mcp/server'; // Changed import
import logger from './utils/logger';
import { environment } from './utils/environment';

// Removed: const app = new Hono();
// Removed: const serverConfig: ServerConfig = { ... };
// Removed: new WorkflowOrchestrationService(app, serverConfig);

async function startWorkflowOrchestrationServer() {
  try {
    logger.info('Starting Workflow Orchestration MCP Server...');

    // createMCPServer now returns the Hono app directly
    const app = await createMCPServer();

    // Start the server
    serve({
      fetch: app.fetch,
      port: environment.PORT,
    }, (info) => {
      logger.info(`Workflow Orchestration MCP Server listening on http://${info.address}:${info.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Workflow Orchestration MCP Server:', error);
    process.exit(1);
  }
}

startWorkflowOrchestrationServer();
