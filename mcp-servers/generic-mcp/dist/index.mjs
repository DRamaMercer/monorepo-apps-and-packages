// src/index.ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { MCPService, MCPTool, MCPResource } from "@modelcontextprotocol/runtime";
import { z } from "zod";
var exampleToolInputSchema = z.object({
  name: z.string().describe("The name to greet.")
});
var exampleToolOutputSchema = z.object({
  greeting: z.string().describe("A personalized greeting.")
});
var exampleResourceOutputSchema = z.object({
  data: z.string().describe("Some example data.")
});
var GenericMCPService = class extends MCPService {
  constructor(app2, config) {
    super(app2, config);
    const greetUserTool = new MCPTool({
      name: "greet_user",
      description: "Greets a user by name.",
      inputSchema: exampleToolInputSchema,
      func: this.greetUser.bind(this)
    });
    const exampleDataResource = new MCPResource({
      name: "example_data",
      description: "Provides some example data.",
      schema: exampleResourceOutputSchema,
      get: this.getExampleData.bind(this)
    });
    this.registerTools([greetUserTool]);
    this.registerResources([exampleDataResource]);
  }
  async greetUser(input) {
    return { greeting: `Hello, ${input.name} from Generic MCP Server!` };
  }
  async getExampleData() {
    return { data: "This is some example data from Generic MCP Server." };
  }
};
var app = new Hono();
var serviceConfig = {
  name: "generic-mcp-server",
  version: "1.0.0",
  description: "Generic MCP server for demonstration and scaffolding."
};
var service = new GenericMCPService(app, serviceConfig);
var port = 3e3;
serve({
  fetch: app.fetch,
  port
}, () => {
  console.log(`Generic MCP Server running on http://localhost:${port}`);
});
//# sourceMappingURL=index.mjs.map