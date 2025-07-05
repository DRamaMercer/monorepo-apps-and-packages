import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { AgentOrchestrationService } from './server';
import { TaskQueueSystem, TaskType, TaskPriority, TaskStatus } from '../queue/taskQueue';
import { AgentManager, AgentType, ModelProvider, AgentStatus as MgrAgentStatus, Agent, AgentCapability } from '../agents/agentManager';
import { ServerConfig, MCPTool } from '@modelcontextprotocol/runtime';
import { createLogger } from '@monorepo/core';
import { z } from 'zod';

// Mock core logger
vi.mock('@monorepo/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/core')>()),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// Mock dependencies: TaskQueueSystem and AgentManager
const mockAddTask = vi.fn();
const mockGetTaskStatus = vi.fn();
const mockGetTaskResult = vi.fn();
const mockTaskQueueSystem = {
  addTask: mockAddTask,
  getTaskStatus: mockGetTaskStatus,
  getTaskResult: mockGetTaskResult,
} as unknown as TaskQueueSystem; // Cast to type, mocking only used methods

const mockFindAgentsByType = vi.fn();
const mockExecuteAgent = vi.fn();
const mockRegisterAgent = vi.fn();
const mockGetAgentStats = vi.fn();
const mockAgentManager = {
  findAgentsByType: mockFindAgentsByType,
  executeAgent: mockExecuteAgent,
  registerAgent: mockRegisterAgent,
  getAgentStats: mockGetAgentStats,
} as unknown as AgentManager; // Cast to type

// Helper to get a tool's function from the service instance
function getToolFuncByName(service: AgentOrchestrationService, toolName: string): ((input: any) => Promise<any>) | undefined {
  // Accessing private 'tools' array via a temporary hack for testing.
  // In a real scenario, consider making 'tools' protected or adding a getter in MCPService.
  const tools = (service as any).tools as MCPTool[];
  const tool = tools.find(t => t.name === toolName);
  return tool?.handler; // handler is the 'func'
}


describe('AgentOrchestrationService MCP Tools', () => {
  let service: AgentOrchestrationService;
  let app: Hono;
  const serverConfig: ServerConfig = { name: 'test-aos', version: '1.0', description: 'Test AOS' };

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono(); // Fresh Hono app for each test
    service = new AgentOrchestrationService(app, serverConfig, {
      taskQueueSystem: mockTaskQueueSystem,
      agentManager: mockAgentManager,
    });
  });

  describe('execute_agent tool', () => {
    const toolName = 'execute_agent';
    const validInput = {
      agentType: AgentType.CONTENT_GENERATION,
      prompt: 'Write a poem.',
    };

    it('should execute an agent if available', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      expect(toolFunc).toBeDefined();

      const mockAgent: Partial<Agent> = { id: 'agent1', status: MgrAgentStatus.IDLE };
      mockFindAgentsByType.mockReturnValue([mockAgent as Agent]);
      mockExecuteAgent.mockResolvedValue({ success: true, output: 'A beautiful poem.' });

      const result = await toolFunc!(validInput);

      expect(mockFindAgentsByType).toHaveBeenCalledWith(AgentType.CONTENT_GENERATION);
      expect(mockExecuteAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: 'agent1', prompt: 'Write a poem.' }));
      expect(result.success).toBe(true);
      expect(result.output).toBe('A beautiful poem.');
    });

    it('should return error if no idle agents are available', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      mockFindAgentsByType.mockReturnValue([]); // No agents of type

      const result = await toolFunc!(validInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No idle agents available');
    });
     it('should return error if agent execution fails', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      const mockAgent: Partial<Agent> = { id: 'agent1', status: MgrAgentStatus.IDLE };
      mockFindAgentsByType.mockReturnValue([mockAgent as Agent]);
      mockExecuteAgent.mockResolvedValue({ success: false, error: 'AI error' });

      const result = await toolFunc!(validInput);
      expect(result.success).toBe(false);
      expect(result.error).toBe('AI error');
    });
  });

  describe('add_task_to_queue tool', () => {
    const toolName = 'add_task_to_queue';
    const validInput = {
      taskType: TaskType.CONTENT_GENERATION,
      payload: { detail: 'some data' },
      priority: 'high',
    };

    it('should add a task to the queue with correct priority mapping', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      mockAddTask.mockResolvedValue('task-123');

      const result = await toolFunc!(validInput);

      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({ type: TaskType.CONTENT_GENERATION, payload: validInput.payload }),
        TaskPriority.HIGH
      );
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-123');
    });
     it('should use medium priority if not specified', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      const inputWithoutPriority = { taskType: TaskType.ANALYTICS_PROCESSING, payload: {} };
      mockAddTask.mockResolvedValue('task-456');

      await toolFunc!(inputWithoutPriority);
      expect(mockAddTask).toHaveBeenCalledWith(expect.any(Object), TaskPriority.MEDIUM);
    });
  });

  describe('get_task_status tool', () => {
    const toolName = 'get_task_status';
    it('should return task status if task exists', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      mockGetTaskStatus.mockResolvedValue(TaskStatus.COMPLETED);
      const result = await toolFunc!({ taskId: 'task-123' });
      expect(mockGetTaskStatus).toHaveBeenCalledWith('task-123');
      expect(result.success).toBe(true);
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });
    it('should return error if task not found', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      mockGetTaskStatus.mockResolvedValue(null);
      const result = await toolFunc!({ taskId: 'unknown-task' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('get_task_result tool', () => {
    const toolName = 'get_task_result';
    it('should return task result if task exists and completed', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      const mockTaskResult = { data: 'some result data' };
      mockGetTaskResult.mockResolvedValue({ success: true, ...mockTaskResult });
      const result = await toolFunc!({ taskId: 'task-123' });
      expect(mockGetTaskResult).toHaveBeenCalledWith('task-123');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ success: true, ...mockTaskResult });
    });
     it('should return error if task not found for result', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      mockGetTaskResult.mockResolvedValue(null);
      const result = await toolFunc!({ taskId: 'unknown-task-result' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('register_agent tool', () => {
    const toolName = 'register_agent';
    const validInput = {
      name: 'New Test Agent',
      type: AgentType.ANALYTICS,
      capabilities: [AgentCapability.ANALYTICS],
      modelProvider: ModelProvider.CUSTOM,
      modelName: 'custom-analytics-model',
    };
    it('should register an agent via AgentManager', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      const mockRegisteredAgent = { id: 'new-agent-id', ...validInput };
      mockRegisterAgent.mockReturnValue(mockRegisteredAgent as any); // Cast for simplicity

      const result = await toolFunc!(validInput);
      expect(mockRegisterAgent).toHaveBeenCalledWith(validInput);
      expect(result.success).toBe(true);
      expect(result.agentId).toBe('new-agent-id');
      expect(result.name).toBe(validInput.name);
    });
  });

  describe('get_agent_stats tool', () => {
    const toolName = 'get_agent_stats';
    it('should return agent stats from AgentManager', async () => {
      const toolFunc = getToolFuncByName(service, toolName);
      const mockStats = { total: 1, idle: 1 };
      mockGetAgentStats.mockReturnValue(mockStats);
      const result = await toolFunc!({}); // No input for this tool
      expect(mockGetAgentStats).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.stats).toEqual(mockStats);
    });
  });

  // orchestrate_workflow tool is more complex and primarily interacts with addTask,
  // so its core logic is somewhat covered by addTask tests.
  // A dedicated test could ensure it calls addTask with TaskType.WORKFLOW_EXECUTION.
  describe('orchestrate_workflow tool', () => {
    const toolName = 'orchestrate_workflow';
    const validInput = {
        workflowType: "test_workflow",
        steps: [{ agentType: AgentType.CONTENT_GENERATION, instruction: "step 1", outputKey: "key1" }],
        context: { initial: "data" },
    };

    it('should add a workflow execution task to the queue', async () => {
        const toolFunc = getToolFuncByName(service, toolName);
        mockAddTask.mockResolvedValue('workflow-task-id-001');

        const result = await toolFunc!(validInput);

        expect(mockAddTask).toHaveBeenCalledWith(
            expect.objectContaining({
                type: TaskType.WORKFLOW_EXECUTION,
                payload: {
                    workflowType: validInput.workflowType,
                    steps: validInput.steps,
                    context: validInput.context,
                }
            }),
            TaskPriority.HIGH
        );
        expect(result.success).toBe(true);
        expect(result.taskId).toBe('workflow-task-id-001');
        expect(result.message).toBe('Workflow orchestration initiated');
    });
  });
});
