import { Hono } from 'hono'; // Assuming Hono is the web framework for MCP servers
// 2. MCPTool Class
export class MCPTool {
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.inputSchema = options.inputSchema;
        this.handler = options.func; // Renamed func to handler for consistency
    }
}
// 3. MCPResource Class
export class MCPResource {
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.schema = options.schema;
        this.handler = options.get; // Renamed get to handler for consistency
    }
}
// 4. MCPService Abstract Class
export class MCPService {
    constructor(app, config) {
        this.tools = [];
        this.resources = [];
        this.app = app;
        this.name = config.name;
        this.version = config.version;
        this.description = config.description;
        // Register basic endpoints for MCP server info
        this.app.get('/mcp/info', (c) => {
            return c.json({
                name: this.name,
                version: this.version,
                description: this.description,
                tools: this.tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema })),
                resources: this.resources.map(resource => ({ name: resource.name, description: resource.description, schema: resource.schema })),
            });
        });
        // Endpoint for executing tools
        this.app.post('/mcp/tool/:toolName', async (c) => {
            const toolName = c.req.param('toolName');
            const tool = this.tools.find(t => t.name === toolName);
            if (!tool) {
                return c.json({ error: `Tool '${toolName}' not found` }, 404);
            }
            try {
                const input = await c.req.json();
                // Here, you might add Zod validation: tool.inputSchema.parse(input);
                const result = await tool.handler(input);
                return c.json(result);
            }
            catch (error) {
                return c.json({ error: error.message || 'Tool execution failed' }, 500);
            }
        });
        // Endpoint for accessing resources
        this.app.get('/mcp/resource/:resourceName/:uri*', async (c) => {
            const resourceName = c.req.param('resourceName');
            const uri = c.req.param('uri') || ''; // Provide a default empty string if undefined
            const resource = this.resources.find(r => r.name === resourceName);
            if (!resource) {
                return c.json({ error: `Resource '${resourceName}' not found` }, 404);
            }
            try {
                const result = await resource.handler(uri);
                return c.json(result);
            }
            catch (error) {
                return c.json({ error: error.message || 'Resource access failed' }, 500);
            }
        });
    }
    // MCP Service methods
    registerTools(tools) {
        this.tools.push(...tools);
    }
    registerResources(resources) {
        this.resources.push(...resources);
    }
    // Methods expected by agent-orchestration (and likely others)
    async handleHttpRequest(request) {
        // This method would typically be used to pass an incoming HTTP request
        // from an external server (like Node.js http server) to the Hono app.
        // For a Hono app, you'd usually use its own server integration.
        // This is a placeholder for direct request handling if needed.
        console.warn("handleHttpRequest not fully implemented for Hono-based MCPService.");
        return { status: 501, body: 'Not Implemented' };
    }
    async initialize() {
        console.log(`${this.name} MCP Service initialized.`);
        // Any service-specific initialization logic
    }
}
// 5. createServer Function
// This function will create and return an instance of a concrete MCPService.
// For now, it will simply return the Hono app itself, and the MCPService will
// be responsible for setting up its own Hono app. This structure seems more
// aligned with how Hono apps are typically used.
export function createServer(config) {
    const app = new Hono();
    // Basic info endpoint
    app.get('/mcp/info', (c) => {
        return c.json(config);
    });
    // The actual MCPService instance will be created and configured
    // within each mcp-server package, and its Hono app will be exported.
    // This createServer function might become obsolete or serve a different purpose,
    // e.g., creating a base Hono app instance for the MCPService to use.
    // For now, let's keep it simple and assume each MCP server
    // will construct its own Hono app and pass it to MCPService.
    return app;
}
//# sourceMappingURL=index.js.map