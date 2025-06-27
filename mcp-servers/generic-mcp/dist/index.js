"use strict";

// src/index.ts
var import_hono = require("hono");
var import_node_server = require("@hono/node-server");
var import_runtime = require("@modelcontextprotocol/runtime");
var import_zod = require("zod");
var exampleToolInputSchema = import_zod.z.object({
  name: import_zod.z.string().describe("The name to greet.")
});
var exampleToolOutputSchema = import_zod.z.object({
  greeting: import_zod.z.string().describe("A personalized greeting.")
});
var exampleResourceOutputSchema = import_zod.z.object({
  data: import_zod.z.string().describe("Some example data.")
});
var GenericMCPService = class extends import_runtime.MCPService {
  constructor(app2, config) {
    super(app2, config);
    const greetUserTool = new import_runtime.MCPTool({
      name: "greet_user",
      description: "Greets a user by name.",
      inputSchema: exampleToolInputSchema,
      func: this.greetUser.bind(this)
    });
    const exampleDataResource = new import_runtime.MCPResource({
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
var app = new import_hono.Hono();
var serviceConfig = {
  name: "generic-mcp-server",
  version: "1.0.0",
  description: "Generic MCP server for demonstration and scaffolding."
};
var service = new GenericMCPService(app, serviceConfig);
var port = 3e3;
(0, import_node_server.serve)({
  fetch: app.fetch,
  port
}, () => {
  console.log(`Generic MCP Server running on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map