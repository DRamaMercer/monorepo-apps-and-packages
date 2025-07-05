import { Hono, Context } from 'hono'; // Assuming Hono is the web framework for MCP servers
import { z, ZodError, ZodTypeAny } from 'zod'; // Import Zod for validation

// 1. ServerConfig Interface
export interface ServerConfig {
  name: string;
  description: string;
  version: string;
}

// 2. MCPTool Class
export class MCPTool {
  public name: string;
  public description: string;
  public inputSchema: ZodTypeAny; // Input schema for the tool
  public handler: (input: any, hContext?: Context) => Promise<any>; // hContext is Hono's context

  constructor(options: {
    name: string;
    description: string;
    inputSchema: ZodTypeAny; // Expect a Zod schema
    func: (input: any, hContext?: Context) => Promise<any>;
  }) {
    this.name = options.name;
    this.description = options.description;
    this.inputSchema = options.inputSchema;
    this.handler = options.func;
  }
}

// 3. MCPResource Class
export class MCPResource {
  public name: string;
  public description: string;
  public schema: ZodTypeAny; // Schema describing the output of the resource
  public handler: (uri: string, hContext?: Context) => Promise<any>; // For 'get' operation

  constructor(options: {
    name: string;
    description: string;
    schema: ZodTypeAny; // Expect a Zod schema for the resource's output
    get: (uri: string, hContext?: Context) => Promise<any>;
  }) {
    this.name = options.name;
    this.description = options.description;
    this.schema = options.schema;
    this.handler = options.get;
  }
}

// 4. MCPService Abstract Class
export abstract class MCPService {
  public name: string;
  public version: string;
  public description: string;
  protected app: Hono; // Hono app instance

  private tools: MCPTool[] = [];
  private resources: MCPResource[] = [];

  constructor(app: Hono, config: ServerConfig) {
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
        const rawInput = await c.req.json();
        const parsedInput = tool.inputSchema.safeParse(rawInput);

        if (!parsedInput.success) {
          // Refine error reporting to include ZodError details
          const zodError = parsedInput.error as ZodError;
          const errorDetails = zodError.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }));
          return c.json({ error: 'Input validation failed', details: errorDetails }, 400);
        }

        // Pass Hono's context `c` to the handler if it needs it
        const result = await tool.handler(parsedInput.data, c);
        return c.json(result);
      } catch (error: any) {
        if (error instanceof ZodError) { // Should be caught by safeParse, but as a fallback
          const errorDetails = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }));
          return c.json({ error: 'Input validation error during processing', details: errorDetails }, 400);
        }
        // Log the error server-side for debugging
        console.error(`[${this.name}] Error executing tool ${toolName}:`, error);
        return c.json({ error: error.message || 'Tool execution failed', details: 'Internal Server Error' }, 500);
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
        // Pass Hono's context `c` to the handler
        const result = await resource.handler(uri, c);
        return c.json(result);
      } catch (error: any) {
        // Log the error server-side for debugging
        console.error(`[${this.name}] Error accessing resource ${resourceName}:`, error);
        return c.json({ error: error.message || 'Resource access failed', details: 'Internal Server Error' }, 500);
      }
    });
  }

  // MCP Service methods
  protected registerTools(tools: MCPTool[]): void {
    this.tools.push(...tools);
  }

  protected registerResources(resources: MCPResource[]): void {
    this.resources.push(...resources);
  }

  // Methods expected by agent-orchestration (and likely others)
  public async handleHttpRequest(request: any): Promise<any> {
    // This method would typically be used to pass an incoming HTTP request
    // from an external server (like Node.js http server) to the Hono app.
    // For a Hono app, you'd usually use its own server integration.
    // This is a placeholder for direct request handling if needed.
    console.warn("handleHttpRequest not fully implemented for Hono-based MCPService.");
    return { status: 501, body: 'Not Implemented' };
  }

  public async initialize(): Promise<void> {
    console.log(`${this.name} MCP Service initialized.`);
    // Any service-specific initialization logic
  }
}

// 5. createServer Function
// This function will create and return an instance of a concrete MCPService.
// For now, it will simply return the Hono app itself, and the MCPService will
// be responsible for setting up its own Hono app. This structure seems more
// aligned with how Hono apps are typically used.
export function createServer(config: ServerConfig): Hono {
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
