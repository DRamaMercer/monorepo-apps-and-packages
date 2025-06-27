import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { MCPService, MCPTool, MCPResource, ServerConfig } from '@modelcontextprotocol/runtime';
import { z } from 'zod';

// Define the schema for the tool's input
const exampleToolInputSchema = z.object({
  name: z.string().describe('The name to greet.'),
});

// Define the schema for the tool's output
const exampleToolOutputSchema = z.object({
  greeting: z.string().describe('A personalized greeting.'),
});

// Define the schema for the resource's output
const exampleResourceOutputSchema = z.object({
  data: z.string().describe('Some example data.'),
});

class GenericMCPService extends MCPService {
  constructor(app: Hono, config: ServerConfig) {
    super(app, config);

    // Define tools
    const greetUserTool = new MCPTool({
      name: 'greet_user',
      description: 'Greets a user by name.',
      inputSchema: exampleToolInputSchema,
      func: this.greetUser.bind(this),
    });

    // Define resources
    const exampleDataResource = new MCPResource({
      name: 'example_data',
      description: 'Provides some example data.',
      schema: exampleResourceOutputSchema,
      get: this.getExampleData.bind(this),
    });

    // Register tools and resources
    this.registerTools([greetUserTool]);
    this.registerResources([exampleDataResource]);
  }

  async greetUser(input: z.infer<typeof exampleToolInputSchema>): Promise<z.infer<typeof exampleToolOutputSchema>> {
    // console.log(`Received greet_user request for: ${input.name}`); // Removed this.logger
    return { greeting: `Hello, ${input.name} from Generic MCP Server!` };
  }

  async getExampleData(): Promise<z.infer<typeof exampleResourceOutputSchema>> {
    // console.log('Received get_example_data request'); // Removed this.logger
    return { data: 'This is some example data from Generic MCP Server.' };
  }
}

const app = new Hono();
const serviceConfig: ServerConfig = {
  name: 'generic-mcp-server',
  version: '1.0.0',
  description: 'Generic MCP server for demonstration and scaffolding.',
};
const service = new GenericMCPService(app, serviceConfig); // Pass app and config to constructor

// The MCPService now handles its own routes internally
// app.post('/mcp', async (c) => { // This block is no longer needed as MCPService handles /mcp/tool and /mcp/resource routes
//   const body = await c.req.json();
//   const response = await service.handleRequest(body); // Removed handleRequest
//   return c.json(response);
// });

const port = 3000; // You can make this configurable
serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`Generic MCP Server running on http://localhost:${port}`);
});
