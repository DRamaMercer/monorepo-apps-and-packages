// src/index.ts
import { serve } from "@hono/node-server";

// src/utils/logger.ts
import pino from "pino";
var logLevel = process.env.LOG_LEVEL || "info";
var logger = pino({
  level: logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname"
    }
  }
});

// src/mcp/server.ts
import { Hono as Hono2 } from "hono";

// ../../packages/runtime/dist/index.js
import { Hono } from "hono";
var MCPTool = class {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.inputSchema = options.inputSchema;
    this.handler = options.func;
  }
};
var MCPResource = class {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.schema = options.schema;
    this.handler = options.get;
  }
};
var MCPService = class {
  constructor(app, config) {
    this.tools = [];
    this.resources = [];
    this.app = app;
    this.name = config.name;
    this.version = config.version;
    this.description = config.description;
    this.app.get("/mcp/info", (c) => {
      return c.json({
        name: this.name,
        version: this.version,
        description: this.description,
        tools: this.tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema })),
        resources: this.resources.map((resource) => ({ name: resource.name, description: resource.description, schema: resource.schema }))
      });
    });
    this.app.post("/mcp/tool/:toolName", async (c) => {
      const toolName = c.req.param("toolName");
      const tool = this.tools.find((t) => t.name === toolName);
      if (!tool) {
        return c.json({ error: `Tool '${toolName}' not found` }, 404);
      }
      try {
        const input = await c.req.json();
        const result = await tool.handler(input);
        return c.json(result);
      } catch (error) {
        return c.json({ error: error.message || "Tool execution failed" }, 500);
      }
    });
    this.app.get("/mcp/resource/:resourceName/:uri*", async (c) => {
      const resourceName = c.req.param("resourceName");
      const uri = c.req.param("uri") || "";
      const resource = this.resources.find((r) => r.name === resourceName);
      if (!resource) {
        return c.json({ error: `Resource '${resourceName}' not found` }, 404);
      }
      try {
        const result = await resource.handler(uri);
        return c.json(result);
      } catch (error) {
        return c.json({ error: error.message || "Resource access failed" }, 500);
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
    console.warn("handleHttpRequest not fully implemented for Hono-based MCPService.");
    return { status: 501, body: "Not Implemented" };
  }
  async initialize() {
    console.log(`${this.name} MCP Service initialized.`);
  }
};

// src/queue/taskQueue.ts
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

// src/utils/environment.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
function loadEnvironment() {
  try {
    let envResult = dotenv.config();
    if (envResult.error) {
      const rootEnvPath = path.resolve(process.cwd(), "../../.env");
      if (fs.existsSync(rootEnvPath)) {
        envResult = dotenv.config({ path: rootEnvPath });
      }
    }
    if (envResult.error) {
      logger.warn("No .env file found, using environment variables");
    } else {
      logger.info("Environment variables loaded");
    }
    const requiredEnvVars = [
      // Add any required environment variables here
      // Example: 'DATABASE_URL'
    ];
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );
    if (missingEnvVars.length > 0) {
      logger.warn(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
      );
    }
  } catch (error) {
    logger.error("Error loading environment variables:", error);
  }
}
function getOptionalEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// src/queue/taskQueue.ts
var TaskQueueSystem = class {
  constructor() {
    this.workers = /* @__PURE__ */ new Map();
    this.processorMap = /* @__PURE__ */ new Map();
    const redisUrl = getOptionalEnv("REDIS_URL", "redis://localhost:6379");
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3
    });
    this.queue = new Queue("agent-orchestration", {
      connection: this.redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1e3
        },
        removeOnComplete: 100,
        // Keep the last 100 completed jobs
        removeOnFail: 200
        // Keep the last 200 failed jobs
      }
    });
    logger.info("Task Queue System created");
  }
  /**
   * Register a task processor function for a specific task type
   */
  registerProcessor(taskType, processor, concurrency = 1) {
    this.processorMap.set(taskType, processor);
    const worker = new Worker(
      "agent-orchestration",
      async (job) => {
        if (job.data.type === taskType) {
          logger.info(`Processing job ${job.id} of type ${taskType}`);
          return processor(job);
        }
        throw new Error(`Worker for ${taskType} received job of type ${job.data.type}`);
      },
      {
        connection: this.redisClient.duplicate(),
        concurrency,
        lockDuration: 3e4
        // 30 seconds
      }
    );
    worker.on("completed", (job) => {
      logger.info(`Job ${job.id} of type ${taskType} completed successfully`);
    });
    worker.on("failed", (job, error) => {
      logger.error(`Job ${job?.id} of type ${taskType} failed:`, error);
    });
    this.workers.set(taskType, worker);
    logger.info(`Registered processor for task type: ${taskType}`);
  }
  /**
   * Add a task to the queue
   */
  async addTask(taskData, priority = 5 /* MEDIUM */, delay = 0) {
    const job = await this.queue.add(taskData.type, taskData, {
      priority,
      delay,
      timeout: taskData.timeout || 6e4,
      // Default timeout of 60 seconds
      jobId: `${taskData.type}-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
    });
    logger.info(`Added job ${job.id} of type ${taskData.type} to queue`);
    return job.id;
  }
  /**
   * Get the status of a task
   */
  async getTaskStatus(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }
    const state = await job.getState();
    switch (state) {
      case "waiting":
      case "delayed":
        return "pending" /* PENDING */;
      case "active":
        return "processing" /* PROCESSING */;
      case "completed":
        return "completed" /* COMPLETED */;
      case "failed":
        return "failed" /* FAILED */;
      case "retrying":
        return "retrying" /* RETRYING */;
      default:
        return null;
    }
  }
  /**
   * Get the result of a completed task
   */
  async getTaskResult(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }
    const state = await job.getState();
    if (state !== "completed") {
      return {
        success: false,
        error: `Job is not completed. Current state: ${state}`
      };
    }
    return {
      success: true,
      data: job.returnvalue
    };
  }
  /**
   * Cancel a pending task
   */
  async cancelTask(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }
    const state = await job.getState();
    if (state === "waiting" || state === "delayed") {
      await job.remove();
      logger.info(`Cancelled job ${jobId}`);
      return true;
    }
    logger.warn(`Cannot cancel job ${jobId} in state ${state}`);
    return false;
  }
  /**
   * Graceful shutdown of the task queue system
   */
  async shutdown() {
    logger.info("Shutting down Task Queue System...");
    for (const [type, worker] of this.workers.entries()) {
      logger.info(`Closing worker for ${type}...`);
      await worker.close();
    }
    await this.queue.close();
    await this.redisClient.quit();
    logger.info("Task Queue System shut down successfully");
  }
};
var taskQueueSystem = null;
async function initializeTaskQueue() {
  if (!taskQueueSystem) {
    taskQueueSystem = new TaskQueueSystem();
  }
  return taskQueueSystem;
}

// src/mcp/server.ts
import { z } from "zod";
var AgentOrchestrationService = class extends MCPService {
  constructor(app, config, dependencies) {
    super(app, config);
    this.taskQueueSystem = dependencies.taskQueueSystem;
    this.agentManager = dependencies.agentManager;
    this.registerTools([
      // 1. Execute Agent Tool
      new MCPTool({
        name: "execute_agent",
        description: "Execute a specific agent with a prompt",
        inputSchema: z.object({
          agentType: z.enum([
            "brand_context",
            "content_generation",
            "analytics",
            "asset_management",
            "workflow_orchestration"
          ]).describe("The type of agent to execute"),
          prompt: z.string().describe("The prompt or instructions to send to the agent"),
          brandContext: z.string().optional().describe("The brand context to use (optional)"),
          temperature: z.number().min(0).max(2).optional().describe("Temperature for generation (optional)"),
          maxTokens: z.number().positive().optional().describe("Maximum tokens to generate (optional)")
        }),
        func: async (input) => {
          logger.info(`Executing agent of type ${input.agentType}`);
          const agents = this.agentManager.findAgentsByType(input.agentType);
          const idleAgents = agents.filter((agent2) => agent2.status === "idle");
          if (idleAgents.length === 0) {
            return {
              success: false,
              error: `No idle agents available of type ${input.agentType}`
            };
          }
          const agent = idleAgents[0];
          const result = await this.agentManager.executeAgent({
            agentId: agent.id,
            prompt: input.prompt,
            brandContext: input.brandContext,
            temperature: input.temperature,
            maxTokens: input.maxTokens
          });
          return {
            success: result.success,
            output: result.output,
            error: result.error,
            usage: result.usage,
            duration: result.duration,
            agentId: result.agentId
          };
        }
      }),
      // 2. Add Task to Queue Tool
      new MCPTool({
        name: "add_task_to_queue",
        description: "Add a task to the orchestration queue",
        inputSchema: z.object({
          taskType: z.enum([
            "content_generation",
            "context_validation",
            "asset_management",
            "analytics_processing",
            "workflow_execution",
            "agent_communication"
          ]).describe("The type of task to add to the queue"),
          payload: z.record(z.any()).describe("The task payload (data needed for the task)"),
          brandContext: z.string().optional().describe("The brand context (optional)"),
          priority: z.enum(["low", "medium", "high", "critical"]).optional().describe("Task priority (optional)"),
          dependsOn: z.array(z.string()).optional().describe("Task IDs this task depends on (optional)"),
          timeout: z.number().positive().optional().describe("Task timeout in milliseconds (optional)")
        }),
        func: async (input) => {
          logger.info(`Adding task of type ${input.taskType} to queue`);
          let priorityValue = 5 /* MEDIUM */;
          if (input.priority) {
            switch (input.priority) {
              case "low":
                priorityValue = 1 /* LOW */;
                break;
              case "medium":
                priorityValue = 5 /* MEDIUM */;
                break;
              case "high":
                priorityValue = 10 /* HIGH */;
                break;
              case "critical":
                priorityValue = 20 /* CRITICAL */;
                break;
            }
          }
          const taskId = await this.taskQueueSystem.addTask(
            // Use this.taskQueueSystem
            {
              type: input.taskType,
              payload: input.payload,
              brandContext: input.brandContext,
              timeout: input.timeout,
              dependsOn: input.dependsOn
            },
            priorityValue
          );
          return {
            success: true,
            taskId
          };
        }
      }),
      // 3. Get Task Status Tool
      new MCPTool({
        name: "get_task_status",
        description: "Get the status of a task in the queue",
        inputSchema: z.object({
          taskId: z.string().describe("The ID of the task to check")
        }),
        func: async (input) => {
          logger.info(`Getting status for task ${input.taskId}`);
          const status = await this.taskQueueSystem.getTaskStatus(input.taskId);
          if (status === null) {
            return {
              success: false,
              error: `Task with ID ${input.taskId} not found`
            };
          }
          return {
            success: true,
            status
          };
        }
      }),
      // 4. Get Task Result Tool
      new MCPTool({
        name: "get_task_result",
        description: "Get the result of a completed task",
        inputSchema: z.object({
          taskId: z.string().describe("The ID of the task to get results for")
        }),
        func: async (input) => {
          logger.info(`Getting result for task ${input.taskId}`);
          const result = await this.taskQueueSystem.getTaskResult(input.taskId);
          if (result === null) {
            return {
              success: false,
              error: `Task with ID ${input.taskId} not found`
            };
          }
          return {
            success: true,
            result
          };
        }
      }),
      // 5. Register Agent Tool
      new MCPTool({
        name: "register_agent",
        description: "Register a new agent with the orchestration layer",
        inputSchema: z.object({
          name: z.string().describe("Name of the agent"),
          type: z.enum([
            "brand_context",
            "content_generation",
            "analytics",
            "asset_management",
            "workflow_orchestration"
          ]).describe("Type of the agent"),
          capabilities: z.array(z.enum([
            "content_generation",
            "context_validation",
            "asset_management",
            "analytics",
            "workflow_orchestration",
            "reasoning",
            "planning",
            "code_generation"
          ])).describe("List of agent capabilities"),
          modelProvider: z.enum([
            "openai",
            "anthropic",
            "ollama",
            "custom"
          ]).describe("The model provider"),
          modelName: z.string().describe("The model name")
        }),
        func: async (input) => {
          logger.info(`Registering new agent: ${input.name} of type ${input.type}`);
          const agent = this.agentManager.registerAgent({
            // Use this.agentManager
            name: input.name,
            type: input.type,
            capabilities: input.capabilities,
            modelProvider: input.modelProvider,
            modelName: input.modelName
          });
          return {
            success: true,
            agentId: agent.id,
            name: agent.name,
            type: agent.type
          };
        }
      }),
      // 6. Get Agent Stats Tool
      new MCPTool({
        name: "get_agent_stats",
        description: "Get statistics about registered agents",
        inputSchema: z.object({}),
        func: async () => {
          logger.info("Getting agent statistics");
          const stats = this.agentManager.getAgentStats();
          return {
            success: true,
            stats
          };
        }
      }),
      // 7. Orchestrate Workflow Tool
      new MCPTool({
        name: "orchestrate_workflow",
        description: "Orchestrate a multi-step workflow using multiple agents",
        inputSchema: z.object({
          workflowType: z.string().describe("Type of workflow to orchestrate"),
          steps: z.array(z.object({
            agentType: z.enum([
              "brand_context",
              "content_generation",
              "analytics",
              "asset_management",
              "workflow_orchestration"
            ]).describe("Type of agent to use for this step"),
            instruction: z.string().describe("Instruction for this step"),
            outputKey: z.string().describe("Key to store the output under"),
            condition: z.string().optional().describe("Condition to execute this step (optional)")
          })).describe("Steps in the workflow"),
          context: z.record(z.any()).describe("Initial context for the workflow"),
          brandContext: z.string().optional().describe("Brand context (optional)"),
          timeout: z.number().positive().optional().describe("Workflow timeout in milliseconds (optional)")
        }),
        func: async (input) => {
          logger.info(`Orchestrating workflow of type: ${input.workflowType}`);
          const taskId = await this.taskQueueSystem.addTask(
            // Use this.taskQueueSystem
            {
              type: "workflow_execution" /* WORKFLOW_EXECUTION */,
              payload: {
                workflowType: input.workflowType,
                steps: input.steps,
                context: input.context
              },
              brandContext: input.brandContext,
              timeout: input.timeout
            },
            10 /* HIGH */
          );
          return {
            success: true,
            message: "Workflow orchestration initiated",
            taskId,
            estimatedSteps: input.steps.length
          };
        }
      })
    ]);
    this.registerResources([
      // 1. Agents Resource - provides information about all registered agents
      new MCPResource({
        name: "agents",
        description: "List of all registered agents and their capabilities",
        schema: z.object({
          // Added schema
          count: z.number(),
          agents: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            capabilities: z.array(z.string()),
            status: z.string(),
            modelProvider: z.string(),
            modelName: z.string(),
            lastActive: z.union([z.string(), z.undefined()])
            // Date might be string after serialization
          }))
        }),
        get: async () => {
          const agents = this.agentManager.getAllAgents().map((agent) => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            capabilities: agent.capabilities,
            status: agent.status,
            modelProvider: agent.modelProvider,
            modelName: agent.modelName,
            lastActive: agent.lastActive
          }));
          return {
            count: agents.length,
            agents
          };
        }
      }),
      // 2. Queue Stats Resource - provides statistics about the task queue
      new MCPResource({
        name: "queue_stats",
        description: "Statistics about the task queue",
        schema: z.object({
          // Added schema
          activeCount: z.number(),
          waitingCount: z.number(),
          completedCount: z.number(),
          failedCount: z.number(),
          avgProcessingTime: z.number()
        }),
        get: async () => {
          return {
            activeCount: 5,
            waitingCount: 12,
            completedCount: 87,
            failedCount: 3,
            avgProcessingTime: 1250
            // ms
          };
        }
      })
    ]);
  }
};
async function createMCPServer(dependencies) {
  const app = new Hono2();
  const config = {
    name: "agent-orchestration",
    description: "AI Agent Orchestration Layer for multi-brand system",
    version: "0.1.0"
  };
  const agentOrchestrationService = new AgentOrchestrationService(app, config, dependencies);
  await agentOrchestrationService.initialize();
  logger.info("Agent Orchestration MCP Server created and configured");
  return app;
}

// src/agents/agentManager.ts
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import fetch from "node-fetch";
var AgentCapability = /* @__PURE__ */ ((AgentCapability2) => {
  AgentCapability2["CONTENT_GENERATION"] = "content_generation";
  AgentCapability2["CONTEXT_VALIDATION"] = "context_validation";
  AgentCapability2["ASSET_MANAGEMENT"] = "asset_management";
  AgentCapability2["ANALYTICS"] = "analytics";
  AgentCapability2["WORKFLOW_ORCHESTRATION"] = "workflow_orchestration";
  AgentCapability2["REASONING"] = "reasoning";
  AgentCapability2["PLANNING"] = "planning";
  AgentCapability2["CODE_GENERATION"] = "code_generation";
  return AgentCapability2;
})(AgentCapability || {});
var AgentStatus = /* @__PURE__ */ ((AgentStatus2) => {
  AgentStatus2["IDLE"] = "idle";
  AgentStatus2["BUSY"] = "busy";
  AgentStatus2["OFFLINE"] = "offline";
  AgentStatus2["ERROR"] = "error";
  return AgentStatus2;
})(AgentStatus || {});
var AgentType = /* @__PURE__ */ ((AgentType2) => {
  AgentType2["BRAND_CONTEXT"] = "brand_context";
  AgentType2["CONTENT_GENERATION"] = "content_generation";
  AgentType2["ANALYTICS"] = "analytics";
  AgentType2["ASSET_MANAGEMENT"] = "asset_management";
  AgentType2["WORKFLOW_ORCHESTRATION"] = "workflow_orchestration";
  return AgentType2;
})(AgentType || {});
var ModelProvider = /* @__PURE__ */ ((ModelProvider2) => {
  ModelProvider2["OPENAI"] = "openai";
  ModelProvider2["ANTHROPIC"] = "anthropic";
  ModelProvider2["OLLAMA"] = "ollama";
  ModelProvider2["CUSTOM"] = "custom";
  return ModelProvider2;
})(ModelProvider || {});
var AgentManager = class {
  // private ollamaClient: any; // Placeholder for Ollama client
  constructor() {
    this.agents = /* @__PURE__ */ new Map();
    this.capabilityIndex = /* @__PURE__ */ new Map();
    this.typeIndex = /* @__PURE__ */ new Map();
    this.modelProviderIndex = /* @__PURE__ */ new Map();
    logger.info("Agent Manager created");
    Object.values(AgentCapability).forEach((capability) => {
      this.capabilityIndex.set(capability, /* @__PURE__ */ new Set());
    });
    Object.values(AgentType).forEach((type) => {
      this.typeIndex.set(type, /* @__PURE__ */ new Set());
    });
    Object.values(ModelProvider).forEach((provider) => {
      this.modelProviderIndex.set(provider, /* @__PURE__ */ new Set());
    });
    const openaiApiKey = getOptionalEnv("OPENAI_API_KEY");
    if (openaiApiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
    } else {
      logger.warn("OPENAI_API_KEY not found. OpenAI agent execution will be simulated.");
    }
    const anthropicApiKey = getOptionalEnv("ANTHROPIC_API_KEY");
    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
    } else {
      logger.warn("ANTHROPIC_API_KEY not found. Anthropic agent execution will be simulated.");
    }
  }
  /**
   * Register a new agent
   */
  registerAgent(request) {
    const agentId = `${request.type}-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const agent = {
      id: agentId,
      name: request.name,
      type: request.type,
      capabilities: request.capabilities,
      status: "idle" /* IDLE */,
      modelProvider: request.modelProvider,
      modelName: request.modelName,
      lastActive: /* @__PURE__ */ new Date(),
      metadata: request.metadata || {}
    };
    this.agents.set(agentId, agent);
    agent.capabilities.forEach((capability) => {
      this.capabilityIndex.get(capability)?.add(agentId);
    });
    this.typeIndex.get(agent.type)?.add(agentId);
    this.modelProviderIndex.get(agent.modelProvider)?.add(agentId);
    logger.info(`Registered agent ${agentId} of type ${agent.type}`);
    return agent;
  }
  /**
   * Get an agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }
  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability) {
    const agentIds = this.capabilityIndex.get(capability) || /* @__PURE__ */ new Set();
    return Array.from(agentIds).map((id) => this.agents.get(id)).filter((agent) => agent !== void 0);
  }
  /**
   * Find agents by type
   */
  findAgentsByType(type) {
    const agentIds = this.typeIndex.get(type) || /* @__PURE__ */ new Set();
    return Array.from(agentIds).map((id) => this.agents.get(id)).filter((agent) => agent !== void 0);
  }
  /**
   * Find idle agents with a specific capability
   */
  findIdleAgentsByCapability(capability) {
    return this.findAgentsByCapability(capability).filter(
      (agent) => agent.status === "idle" /* IDLE */
    );
  }
  /**
   * Execute a task with an agent
   */
  async executeAgent(request) {
    const agent = this.agents.get(request.agentId);
    if (!agent) {
      return {
        agentId: request.agentId,
        success: false,
        error: `Agent with ID ${request.agentId} not found`
      };
    }
    if (agent.status === "busy" /* BUSY */) {
      return {
        agentId: request.agentId,
        success: false,
        error: `Agent ${request.agentId} is busy`
      };
    }
    try {
      agent.status = "busy" /* BUSY */;
      agent.lastActive = /* @__PURE__ */ new Date();
      logger.info(`Executing agent ${request.agentId} of type ${agent.type}`);
      const startTime = Date.now();
      let result;
      switch (agent.modelProvider) {
        case "openai" /* OPENAI */:
          result = await this.executeOpenAI(agent, request);
          break;
        case "anthropic" /* ANTHROPIC */:
          result = await this.executeAnthropic(agent, request);
          break;
        case "ollama" /* OLLAMA */:
          result = await this.executeOllama(agent, request);
          break;
        case "custom" /* CUSTOM */:
          result = await this.executeCustom(agent, request);
          break;
        default:
          result = {
            agentId: agent.id,
            success: false,
            error: `Unsupported model provider: ${agent.modelProvider}`
          };
      }
      const duration = Date.now() - startTime;
      result.duration = duration;
      agent.status = "idle" /* IDLE */;
      return result;
    } catch (error) {
      logger.error(`Error executing agent ${request.agentId}:`, error);
      agent.status = "error" /* ERROR */;
      return {
        agentId: request.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Execute with OpenAI API
   */
  async executeOpenAI(agent, request) {
    if (!this.openaiClient) {
      return {
        agentId: agent.id,
        success: false,
        error: "OpenAI client not initialized. Missing API key."
      };
    }
    try {
      const completion = await this.openaiClient.chat.completions.create({
        messages: [
          { role: "system", content: request.systemInstructions || "You are a helpful AI agent." },
          { role: "user", content: request.prompt }
        ],
        model: agent.modelName,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1024
        // tools: request.tools // Enable if tools are supported by the agent and model
      });
      const output = completion.choices[0]?.message?.content || "";
      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      return {
        agentId: agent.id,
        success: true,
        output,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        metadata: {
          model: agent.modelName,
          brand: request.brandContext,
          finishReason: completion.choices[0]?.finish_reason
        }
      };
    } catch (error) {
      logger.error(`OpenAI execution error for agent ${agent.id}:`, error);
      return {
        agentId: agent.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Execute with Anthropic API
   */
  async executeAnthropic(agent, request) {
    if (!this.anthropicClient) {
      return {
        agentId: agent.id,
        success: false,
        error: "Anthropic client not initialized. Missing API key."
      };
    }
    try {
      const response = await this.anthropicClient.messages.create({
        model: agent.modelName,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        system: request.systemInstructions || "You are a helpful AI agent.",
        messages: [
          { role: "user", content: request.prompt }
        ]
      });
      const output = response.content.map((block) => block.text).join("\n");
      const usage = response.usage;
      return {
        agentId: agent.id,
        success: true,
        output,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens
        },
        metadata: {
          model: agent.modelName,
          brand: request.brandContext,
          stopReason: response.stop_reason
        }
      };
    } catch (error) {
      logger.error(`Anthropic execution error for agent ${agent.id}:`, error);
      return {
        agentId: agent.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Execute with Ollama API
   */
  async executeOllama(agent, request) {
    const ollamaBaseUrl = getOptionalEnv("OLLAMA_BASE_URL", "http://localhost:11434");
    try {
      const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: agent.modelName,
          messages: [
            { role: "system", content: request.systemInstructions || "You are a helpful AI agent." },
            { role: "user", content: request.prompt }
          ],
          options: {
            temperature: request.temperature || 0.7,
            num_ctx: request.maxTokens || 1024
            // Ollama uses num_ctx for context window size, which is similar to max_tokens
          },
          stream: false
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      const output = data.message?.content || "";
      const usage = data.usage || { prompt_eval_count: 0, eval_count: 0, total_eval_count: 0 };
      return {
        agentId: agent.id,
        success: true,
        output,
        usage: {
          promptTokens: usage.prompt_eval_count,
          // Ollama uses prompt_eval_count for prompt tokens
          completionTokens: usage.eval_count,
          // Ollama uses eval_count for completion tokens
          totalTokens: usage.total_eval_count
          // Ollama uses total_eval_count for total tokens
        },
        metadata: {
          model: agent.modelName,
          brand: request.brandContext
        }
      };
    } catch (error) {
      logger.error(`Ollama execution error for agent ${agent.id}:`, error);
      return {
        agentId: agent.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Execute with Custom Model (placeholder for generic API interaction)
   */
  async executeCustom(agent, request) {
    logger.warn(`Custom model execution for agent ${agent.id} is being handled generically.`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      agentId: agent.id,
      success: true,
      output: `[Custom Model] Processed: ${request.prompt} with model ${agent.modelName}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: Math.floor(request.prompt.length / 5),
        // Arbitrary
        totalTokens: request.prompt.length + Math.floor(request.prompt.length / 5)
      },
      metadata: {
        model: agent.modelName,
        brand: request.brandContext
      }
    };
  }
  /**
   * Update agent status
   */
  updateAgentStatus(agentId, status) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    agent.status = status;
    agent.lastActive = /* @__PURE__ */ new Date();
    logger.info(`Updated agent ${agentId} status to ${status}`);
    return true;
  }
  /**
   * Remove an agent
   */
  removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    agent.capabilities.forEach((capability) => {
      this.capabilityIndex.get(capability)?.delete(agentId);
    });
    this.typeIndex.get(agent.type)?.delete(agentId);
    this.modelProviderIndex.get(agent.modelProvider)?.delete(agentId);
    this.agents.delete(agentId);
    logger.info(`Removed agent ${agentId}`);
    return true;
  }
  /**
   * Get all registered agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }
  /**
   * Get agent stats
   */
  getAgentStats() {
    const totalAgents = this.agents.size;
    const agentsByType = Object.values(AgentType).reduce((acc, type) => {
      acc[type] = this.typeIndex.get(type)?.size || 0;
      return acc;
    }, {});
    const agentsByStatus = Object.values(AgentStatus).reduce((acc, status) => {
      acc[status] = Array.from(this.agents.values()).filter(
        (agent) => agent.status === status
      ).length;
      return acc;
    }, {});
    const agentsByModelProvider = Object.values(ModelProvider).reduce((acc, provider) => {
      acc[provider] = this.modelProviderIndex.get(provider)?.size || 0;
      return acc;
    }, {});
    return {
      totalAgents,
      agentsByType,
      agentsByStatus,
      agentsByModelProvider
    };
  }
};
var agentManager = null;
async function initializeAgentManager() {
  if (!agentManager) {
    agentManager = new AgentManager();
    const registerDefaultAgents = getOptionalEnv("REGISTER_DEFAULT_AGENTS", "true") === "true";
    if (registerDefaultAgents) {
      agentManager.registerAgent({
        name: "Brand Context Manager",
        type: "brand_context" /* BRAND_CONTEXT */,
        capabilities: [
          "context_validation" /* CONTEXT_VALIDATION */,
          "reasoning" /* REASONING */
        ],
        modelProvider: "openai" /* OPENAI */,
        modelName: "gpt-4"
      });
      agentManager.registerAgent({
        name: "Content Generator",
        type: "content_generation" /* CONTENT_GENERATION */,
        capabilities: [
          "content_generation" /* CONTENT_GENERATION */,
          "code_generation" /* CODE_GENERATION */
        ],
        modelProvider: "anthropic" /* ANTHROPIC */,
        modelName: "claude-3-opus-20240229"
      });
      agentManager.registerAgent({
        name: "Workflow Orchestrator",
        type: "workflow_orchestration" /* WORKFLOW_ORCHESTRATION */,
        capabilities: [
          "workflow_orchestration" /* WORKFLOW_ORCHESTRATION */,
          "planning" /* PLANNING */
        ],
        modelProvider: "openai" /* OPENAI */,
        modelName: "gpt-4-turbo"
      });
      agentManager.registerAgent({
        name: "Analytics Agent",
        type: "analytics" /* ANALYTICS */,
        capabilities: [
          "analytics" /* ANALYTICS */,
          "reasoning" /* REASONING */
        ],
        modelProvider: "anthropic" /* ANTHROPIC */,
        modelName: "claude-3-sonnet-20240229"
      });
      agentManager.registerAgent({
        name: "Asset Manager",
        type: "asset_management" /* ASSET_MANAGEMENT */,
        capabilities: [
          "asset_management" /* ASSET_MANAGEMENT */
        ],
        modelProvider: "ollama" /* OLLAMA */,
        modelName: "llama3"
      });
      logger.info("Registered default agents");
    }
  }
  return agentManager;
}

// src/index.ts
loadEnvironment();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3020;
async function startServer() {
  try {
    logger.info("Starting AI Agent Orchestration MCP Server...");
    const taskQueueSystem2 = await initializeTaskQueue();
    logger.info("Task Queue System initialized");
    const agentManager2 = await initializeAgentManager();
    logger.info("Agent Manager initialized");
    const app = await createMCPServer({
      taskQueueSystem: taskQueueSystem2,
      agentManager: agentManager2
    });
    logger.info("MCP Server Hono app created");
    serve({
      fetch: app.fetch,
      // Use the fetch handler from the created Hono app
      port: PORT
    });
    logger.info(`Server listening on port ${PORT}`);
    logger.info("MCP Server initialized and ready to handle requests");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
  process.exit(1);
});
//# sourceMappingURL=index.mjs.map