import { 
  MCPServer, 
  createServer, 
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

/**
 * Create and configure the MCP server instance
 */
export async function createMCPServer(
  dependencies: MCPServerDependencies
): Promise<MCPServer> {
  const { taskQueueSystem, agentManager } = dependencies;
  
  // Create the MCP server
  const server = createServer({
    name: 'agent-orchestration',
    description: 'AI Agent Orchestration Layer for multi-brand system',
    version: '0.1.0',
  });

  // Define tools
  
  // 1. Execute Agent Tool
  const executeAgentTool: MCPTool = {
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
    handler: async (input) => {
      logger.info(`Executing agent of type ${input.agentType}`);
      
      // Find an idle agent of the requested type
      const agents = agentManager.findAgentsByType(input.agentType as AgentType);
      const idleAgents = agents.filter(agent => agent.status === 'idle');
      
      if (idleAgents.length === 0) {
        return {
          success: false,
          error: `No idle agents available of type ${input.agentType}`
        };
      }
      
      // Select the first idle agent
      const agent = idleAgents[0];
      
      // Execute the agent
      const result = await agentManager.executeAgent({
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
  };
  
  // 2. Task Queue Tool
  const addTaskToQueueTool: MCPTool = {
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
    handler: async (input) => {
      logger.info(`Adding task of type ${input.taskType} to queue`);
      
      // Map priority string to enum
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
      
      // Add task to queue
      const taskId = await taskQueueSystem.addTask(
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
  };
  
  // 3. Get Task Status Tool
  const getTaskStatusTool: MCPTool = {
    name: 'get_task_status',
    description: 'Get the status of a task in the queue',
    inputSchema: z.object({
      taskId: z.string().describe('The ID of the task to check')
    }),
    handler: async (input) => {
      logger.info(`Getting status for task ${input.taskId}`);
      
      const status = await taskQueueSystem.getTaskStatus(input.taskId);
      
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
  };
  
  // 4. Get Task Result Tool
  const getTaskResultTool: MCPTool = {
    name: 'get_task_result',
    description: 'Get the result of a completed task',
    inputSchema: z.object({
      taskId: z.string().describe('The ID of the task to get results for')
    }),
    handler: async (input) => {
      logger.info(`Getting result for task ${input.taskId}`);
      
      const result = await taskQueueSystem.getTaskResult(input.taskId);
      
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
  };
  
  // 5. Register Agent Tool
  const registerAgentTool: MCPTool = {
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
    handler: async (input) => {
      logger.info(`Registering new agent: ${input.name} of type ${input.type}`);
      
      const agent = agentManager.registerAgent({
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
  };
  
  // 6. Get Agent Stats Tool
  const getAgentStatsTool: MCPTool = {
    name: 'get_agent_stats',
    description: 'Get statistics about registered agents',
    inputSchema: z.object({}),
    handler: async () => {
      logger.info('Getting agent statistics');
      
      const stats = agentManager.getAgentStats();
      
      return {
        success: true,
        stats
      };
    }
  };
  
  // 7. Orchestrate Workflow Tool
  const orchestrateWorkflowTool: MCPTool = {
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
    handler: async (input) => {
      logger.info(`Orchestrating workflow of type: ${input.workflowType}`);
      
      // This is a more complex workflow orchestration that would involve:
      // 1. Creating a workflow context
      // 2. Executing each step in sequence, with potential branching based on conditions
      // 3. Storing outputs from each step in the context
      // 4. Handling errors and timeouts
      
      // For this implementation, we'll simulate a basic workflow execution
      
      // Add task to queue with high priority
      const taskId = await taskQueueSystem.addTask(
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
  };
  
  // Register tools
  server.registerTool(executeAgentTool);
  server.registerTool(addTaskToQueueTool);
  server.registerTool(getTaskStatusTool);
  server.registerTool(getTaskResultTool);
  server.registerTool(registerAgentTool);
  server.registerTool(getAgentStatsTool);
  server.registerTool(orchestrateWorkflowTool);

  // Define resources
  
  // 1. Agents Resource - provides information about all registered agents
  const agentsResource: MCPResource = {
    name: 'agents',
    description: 'List of all registered agents and their capabilities',
    handler: async () => {
      const agents = agentManager.getAllAgents().map(agent => ({
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
  };
  
  // 2. Queue Stats Resource - provides statistics about the task queue
  const queueStatsResource: MCPResource = {
    name: 'queue_stats',
    description: 'Statistics about the task queue',
    handler: async () => {
      // In a real implementation, this would query the queue for stats
      // For now, we'll return simulated stats
      return {
        activeCount: 5,
        waitingCount: 12,
        completedCount: 87,
        failedCount: 3,
        avgProcessingTime: 1250 // ms
      };
    }
  };
  
  // Register resources
  server.registerResource(agentsResource);
  server.registerResource(queueStatsResource);
  
  logger.info('MCP Server created with tools and resources');
  
  return server;
}
