import { serve } from '@hono/node-server';
// Removed: import { ServerConfig } from '@modelcontextprotocol/runtime'; // Not needed here
import { createMCPServer } from './mcp/server'; // Changed import
import logger from './utils/logger';
import { environment } from './utils/environment';
// Removed: const app = new Hono();
// Removed: const serverConfig: ServerConfig = { ... };
// Removed: new AnalyticsService(app, serverConfig);
async function startAnalyticsServer() {
    try {
        logger.info('Starting Analytics MCP Server...');
        // createMCPServer now returns the Hono app directly
        const app = await createMCPServer();
        // Start the server
        serve({
            fetch: app.fetch,
            port: environment.PORT,
        }, (info) => {
            logger.info(`Analytics MCP Server listening on http://${info.address}:${info.port}`);
        });
    }
    catch (error) {
        logger.error('Failed to start Analytics MCP Server:', error);
        process.exit(1);
    }
}
startAnalyticsServer();
//# sourceMappingURL=index.js.map