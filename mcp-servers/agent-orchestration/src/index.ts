import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createLogger, DEFAULT_PORTS } from '@monorepo/core';
import { createMCPServer } from './mcp/server';
import { initializeTaskQueue } from './queue/taskQueue';
import { initializeAgentManager } from './agents/agentManager';
import { loadEnvironment } from './utils/environment';
// Removed: import { MCPServer } from '@modelcontextprotocol/runtime'; // No longer needed here

const logger = createLogger({ serviceName: 'agent-orchestration-mcp' });

// Load environment variables
loadEnvironment();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORTS.AGENT_ORCHESTRATION_MCP;


async function startServer() {
  try {
    logger.info('Starting AI Agent Orchestration MCP Server...');
    
    // Initialize the task queue system
    const taskQueueSystem = await initializeTaskQueue();
    logger.info('Task Queue System initialized');
    
    // Initialize the agent manager
    const agentManager = await initializeAgentManager(logger); // Pass the service logger
    logger.info('Agent Manager initialized');
    
    // Create the Hono app instance for the MCP server
    // createMCPServer now returns the Hono app directly
    const app = await createMCPServer({
      taskQueueSystem,
      agentManager
    });
    logger.info('MCP Server Hono app created');
    
    // Health check endpoint (already defined in the Hono app returned by createMCPServer)
    // No need to redefine here if it's already part of the returned app.
    // Assuming createMCPServer handles all MCP-specific routes including /mcp/*
    
    // Start the server
    serve({
      fetch: app.fetch, // Use the fetch handler from the created Hono app
      port: PORT
    });
    
    logger.info(`Server listening on port ${PORT}`);
    
    // The initialize method is now called internally within the MCPService constructor
    // No need to call mcpServer.initialize() here anymore
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
