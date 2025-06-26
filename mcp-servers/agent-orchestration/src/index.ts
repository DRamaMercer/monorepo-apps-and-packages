import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from './utils/logger';
import { createMCPServer } from './mcp/server';
import { initializeTaskQueue } from './queue/taskQueue';
import { initializeAgentManager } from './agents/agentManager';
import { loadEnvironment } from './utils/environment';
import { MCPServer } from '@modelcontextprotocol/runtime';

// Load environment variables
loadEnvironment();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3020;

async function startServer() {
  try {
    logger.info('Starting AI Agent Orchestration MCP Server...');
    
    // Initialize the task queue system
    const taskQueueSystem = await initializeTaskQueue();
    logger.info('Task Queue System initialized');
    
    // Initialize the agent manager
    const agentManager = await initializeAgentManager();
    logger.info('Agent Manager initialized');
    
    // Create the MCP server instance
    const mcpServer: MCPServer = await createMCPServer({
      taskQueueSystem,
      agentManager
    });
    logger.info('MCP Server created');
    
    // Create the HTTP server
    const app = new Hono();
    
    // Health check endpoint
    app.get('/health', (c) => {
      return c.json({
        status: 'healthy',
        version: process.env.npm_package_version || '0.1.0',
        name: 'AI Agent Orchestration MCP'
      });
    });
    
    // Mount the MCP server routes
    app.use('/mcp/*', async (c) => {
      const response = await mcpServer.handleHttpRequest(c.req.raw);
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    });
    
    // Start the server
    serve({
      fetch: app.fetch,
      port: PORT
    });
    
    logger.info(`Server listening on port ${PORT}`);
    
    // Initialize event listeners and connections
    await mcpServer.initialize();
    logger.info('MCP Server initialized and ready to handle requests');
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Cleanup code here (close connections, etc.)
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  // Cleanup code here (close connections, etc.)
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});
