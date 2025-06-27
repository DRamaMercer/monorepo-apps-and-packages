import { serve } from '@hono/node-server';
import { logger } from './utils/logger';
import { createMCPServer } from './mcp/server';
import { loadEnvironment } from './utils/environment';
import { initializeSupabase } from './models/supabaseClient';
// Removed: import { MCPServer } from '@modelcontextprotocol/runtime'; // No longer needed here
// Load environment variables
loadEnvironment();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3021;
async function startServer() {
    try {
        logger.info('Starting Brand Context MCP Server...');
        // Initialize Supabase client
        initializeSupabase();
        logger.info('Supabase client initialized');
        // Create the Hono app instance for the MCP server
        // createMCPServer now returns the Hono app directly
        const app = await createMCPServer();
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map