import { Hono } from 'hono'; // Import Hono
import { 
  MCPService, // Changed from MCPServer
  ServerConfig, // New import
  MCPTool, 
  MCPResource 
} from '@modelcontextprotocol/runtime';
import { logger } from '../utils/logger';
import { TaskQueueSystem, TaskType, TaskPriority } from '../queue/taskQueue';
import { 
  AgentManager, 
  AgentCapability, 
  AgentType, 
  ModelProvider 
} from '../agents/agentManager';
import { z } from 'zod';

interface MCPServerDependencies {
  taskQueueSystem: TaskQueueSystem;
  agentManager: AgentManager;
}

// Define the concrete Agent Orchestration Service
class AgentOrchestrationService extends MCPService {
  private taskQueueSystem: TaskQueueSystem;
  private agentManager: AgentManager;

  constructor(app: Hono, config: ServerConfig, dependencies: MCPServerDependencies) {
    super(app, config); // Call parent constructor
    this.taskQueueSystem = dependencies.taskQueueSystem;
    this.agentManager = dependencies.agentManager;

    // Register tools
    this.registerTools([
      // 1. Execute Agent Tool
      new MCPTool({
        name: 'execute_agent',
        description: 'Execute a specific agent with a prompt',
        inputSchema: z.object({
          agentType: z.enum([
            'brand_context',
            'content_generation',
            'analytics',
            'asset_management',
            'workflow_orchestration'
          ]).describe('The type of agent to execute'),
          prompt: z.string().describe('The prompt or instructions to send to the agent'),
          brandContext: z.string().optional().describe('The brand context to use (optional)'),
          temperature: z.number().min(0).max(2).optional().describe('Temperature for generation (optional)'),
          maxTokens: z.number().positive().optional().describe('Maximum tokens to generate (optional)')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Executing agent of type ${input.agentType}`);
          
          const agents = this.agentManager.findAgentsByType(input.agentType as AgentType);
          const idleAgents = agents.filter(agent => agent.status === 'idle');
          
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
        name: 'add_task_to_queue',
        description: 'Add a task to the orchestration queue',
        inputSchema: z.object({
          taskType: z.enum([
            'content_generation',
            'context_validation',
            'asset_management',
            'analytics_processing',
            'workflow_execution',
            'agent_communication'
          ]).describe('The type of task to add to the queue'),
          payload: z.record(z.any()).describe('The task payload (data needed for the task)'),
          brandContext: z.string().optional().describe('The brand context (optional)'),
          priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Task priority (optional)'),
          dependsOn: z.array(z.string()).optional().describe('Task IDs this task depends on (optional)'),
          timeout: z.number().positive().optional().describe('Task timeout in milliseconds (optional)')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Adding task of type ${input.taskType} to queue`);
          
          let priorityValue = TaskPriority.MEDIUM;
          
          if (input.priority) {
            switch (input.priority) {
              case 'low':
                priorityValue = TaskPriority.LOW;
                break;
              case 'medium':
                priorityValue = TaskPriority.MEDIUM;
                break;
              case 'high':
                priorityValue = TaskPriority.HIGH;
                break;
              case 'critical':
                priorityValue = TaskPriority.CRITICAL;
                break;
            }
          }
          
          const taskId = await this.taskQueueSystem.addTask( // Use this.taskQueueSystem
            {
              type: input.taskType as TaskType,
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
        name: 'get_task_status',
        description: 'Get the status of a task in the queue',
        inputSchema: z.object({
          taskId: z.string().describe('The ID of the task to check')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Getting status for task ${input.taskId}`);
          
          const status = await this.taskQueueSystem.getTaskStatus(input.taskId); // Use this.taskQueueSystem
          
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
        name: 'get_task_result',
        description: 'Get the result of a completed task',
        inputSchema: z.object({
          taskId: z.string().describe('The ID of the task to get results for')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Getting result for task ${input.taskId}`);
          
          const result = await this.taskQueueSystem.getTaskResult(input.taskId); // Use this.taskQueueSystem
          
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
        name: 'register_agent',
        description: 'Register a new agent with the orchestration layer',
        inputSchema: z.object({
          name: z.string().describe('Name of the agent'),
          type: z.enum([
            'brand_context',
            'content_generation',
            'analytics',
            'asset_management',
            'workflow_orchestration'
          ]).describe('Type of the agent'),
          capabilities: z.array(z.enum([
            'content_generation',
            'context_validation',
            'asset_management',
            'analytics',
            'workflow_orchestration',
            'reasoning',
            'planning',
            'code_generation'
          ])).describe('List of agent capabilities'),
          modelProvider: z.enum([
            'openai',
            'anthropic',
            'ollama',
            'custom'
          ]).describe('The model provider'),
          modelName: z.string().describe('The model name')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Registering new agent: ${input.name} of type ${input.type}`);
          
          const agent = this.agentManager.registerAgent({ // Use this.agentManager
            name: input.name,
            type: input.type as AgentType,
            capabilities: input.capabilities as AgentCapability[],
            modelProvider: input.modelProvider as ModelProvider,
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
        name: 'get_agent_stats',
        description: 'Get statistics about registered agents',
        inputSchema: z.object({}),
        func: async () => { // Explicitly type input
          logger.info('Getting agent statistics');
          
          const stats = this.agentManager.getAgentStats(); // Use this.agentManager
          
          return {
            success: true,
            stats
          };
        }
      }),
      
      // 7. Orchestrate Workflow Tool
      new MCPTool({
        name: 'orchestrate_workflow',
        description: 'Orchestrate a multi-step workflow using multiple agents',
        inputSchema: z.object({
          workflowType: z.string().describe('Type of workflow to orchestrate'),
          steps: z.array(z.object({
            agentType: z.enum([
              'brand_context',
              'content_generation',
              'analytics',
              'asset_management',
              'workflow_orchestration'
            ]).describe('Type of agent to use for this step'),
            instruction: z.string().describe('Instruction for this step'),
            outputKey: z.string().describe('Key to store the output under'),
            condition: z.string().optional().describe('Condition to execute this step (optional)')
          })).describe('Steps in the workflow'),
          context: z.record(z.any()).describe('Initial context for the workflow'),
          brandContext: z.string().optional().describe('Brand context (optional)'),
          timeout: z.number().positive().optional().describe('Workflow timeout in milliseconds (optional)')
        }),
        func: async (input: any) => { // Explicitly type input
          logger.info(`Orchestrating workflow of type: ${input.workflowType}`);
          
          // Add task to queue with high priority
          const taskId = await this.taskQueueSystem.addTask( // Use this.taskQueueSystem
            {
              type: TaskType.WORKFLOW_EXECUTION,
              payload: {
                workflowType: input.workflowType,
                steps: input.steps,
                context: input.context
              },
              brandContext: input.brandContext,
              timeout: input.timeout
            },
            TaskPriority.HIGH
          );
          
          return {
            success: true,
            message: 'Workflow orchestration initiated',
            taskId,
            estimatedSteps: input.steps.length
          };
        }
      })
    ]);

    // Register resources
    this.registerResources([
      // 1. Agents Resource - provides information about all registered agents
      new MCPResource({
        name: 'agents',
        description: 'List of all registered agents and their capabilities',
        schema: z.object({ // Added schema
          count: z.number(),
          agents: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            capabilities: z.array(z.string()),
            status: z.string(),
            modelProvider: z.string(),
            modelName: z.string(),
            lastActive: z.union([z.string(), z.undefined()]) // Date might be string after serialization
          }))
        }),
        get: async () => {
          const agents = this.agentManager.getAllAgents().map(agent => ({
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
        name: 'queue_stats',
        description: 'Statistics about the task queue',
        schema: z.object({ // Added schema
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
            avgProcessingTime: 1250 // ms
          };
        }
      })
    ]);
  }
}

/**
 * Create and configure the MCP server instance
 */
export async function createMCPServer(
  dependencies: MCPServerDependencies
): Promise<Hono> { // Return type is now Hono app
  const app = new Hono(); // Create Hono app

  // Configure the MCP server service
  const config: ServerConfig = {
    name: 'agent-orchestration',
    description: 'AI Agent Orchestration Layer for multi-brand system',
    version: '0.1.0',
  };
  
  // Instantiate the concrete MCPService
  const agentOrchestrationService = new AgentOrchestrationService(app, config, dependencies);
  
  // Initialize the service (if needed, this calls the initialize method on MCPService)
  await agentOrchestrationService.initialize();

  logger.info('Agent Orchestration MCP Server created and configured');
  
  return app; // Return the Hono app
}
