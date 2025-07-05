import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AgentManager,
  initializeAgentManager,
  getAgentManager,
  AgentType,
  AgentCapability,
  ModelProvider,
  AgentStatus,
  AgentRegistrationRequest,
  AgentExecutionRequest,
  Agent,
} from './agentManager';
import OpenAI_SDK from 'openai';
import Anthropic_SDK from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { Logger as CoreLogger } from '@monorepo/core'; // For type annotation

// --- Mock Dependencies ---

// 1. Mock for @monorepo/core and its createLogger
// This mock is self-contained to avoid hoisting ReferenceErrors.
vi.mock('@monorepo/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@monorepo/core')>();
  return {
    ...original,
    // createLogger is a spy that, by default, returns an object with method spies.
    createLogger: vi.fn().mockImplementation(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  };
});

// 2. Mock for ../utils/environment
vi.mock('../utils/environment', () => ({
  getOptionalEnv: vi.fn(),
}));

// 3. Mock for AI SDKs (openai, @anthropic-ai/sdk)
const mockOpenAIChatCompletionsCreate_SPY = vi.fn();
vi.mock('openai', () => {
  const constructorMock = vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockOpenAIChatCompletionsCreate_SPY } }
  }));
  return { default: constructorMock, OpenAI: constructorMock };
});

const mockAnthropicMessagesCreate_SPY = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  const constructorMock = vi.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicMessagesCreate_SPY }
  }));
  return { default: constructorMock, Anthropic: constructorMock };
});

// 4. Mock for node-fetch
vi.mock('node-fetch', () => ({ default: vi.fn() }));


// --- Test Suite ---
describe('AgentManager', () => {
  let agentManagerInstance: AgentManager;
  let mockedFetch: vi.Mock;
  let mockInjectedLogger: { info: vi.Mock, warn: vi.Mock, error: vi.Mock, debug: vi.Mock };

  beforeEach(async () => {
    vi.resetAllMocks();

    // This is the logger that will be injected into AgentManager
    mockInjectedLogger = {
      info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
    };

    // If AgentManager's default constructor relies on createLogger from @monorepo/core,
    // ensure that mock is set up to return a working logger for instantiations
    // that *don't* receive an injected logger (like in some singleton tests).
    const core = await import('@monorepo/core');
    (core.createLogger as vi.Mock).mockReturnValue(mockInjectedLogger);


    mockedFetch = fetch as vi.Mock;

    const { getOptionalEnv } = await import('../utils/environment');
    (getOptionalEnv as vi.Mock).mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'OPENAI_API_KEY') return 'fake-openai-key';
      if (key === 'ANTHROPIC_API_KEY') return 'fake-anthropic-key';
      if (key === 'OLLAMA_BASE_URL') return 'http://localhost:11434';
      if (key === 'REGISTER_DEFAULT_AGENTS') return 'false';
      return defaultValue;
    });

    const { AgentManager: FreshAgentManager } = await vi.importActual('./agentManager');
    // Pass the mockInjectedLogger for DI
    agentManagerInstance = new FreshAgentManager(mockInjectedLogger as CoreLogger);
  });

  afterEach(() => { vi.useRealTimers(); });

  describe('Constructor and Initialization', () => {
    it('should create an instance and use provided logger', () => {
      expect(agentManagerInstance).toBeInstanceOf(AgentManager);
      // AgentManager constructor calls this.logger.info
      expect(mockInjectedLogger.info).toHaveBeenCalledWith('Agent Manager created');
    });

    it('should initialize AI clients if API keys are provided', async () => {
      const { getOptionalEnv } = await import('../utils/environment');
      (getOptionalEnv as vi.Mock).mockImplementation((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'fake-key';
        if (key === 'ANTHROPIC_API_KEY') return 'fake-key';
        return undefined;
      });
      const OpenAIConstructorMock = OpenAI_SDK as vi.Mock; // Using aliased import
      const AnthropicConstructorMock = Anthropic_SDK as vi.Mock; // Using aliased import

      const specificTestLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      // vi.resetModules(); // Not needed if we pass logger directly
      const { AgentManager: FreshAgentManager } = await vi.importActual('./agentManager');
      new FreshAgentManager(specificTestLogger as CoreLogger);

      expect(OpenAIConstructorMock).toHaveBeenCalled();
      expect(AnthropicConstructorMock).toHaveBeenCalled();
      expect(specificTestLogger.info).toHaveBeenCalledWith('Agent Manager created');
    });

    it('should log warnings via injected logger if API keys are missing', async () => {
      const { getOptionalEnv } = await import('../utils/environment');
      (getOptionalEnv as vi.Mock).mockImplementation((key: string) => {
        if (key === 'OPENAI_API_KEY') return undefined;
        if (key === 'ANTHROPIC_API_KEY') return undefined;
        return undefined;
      });

      const specificTestLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      // vi.resetModules(); // Not needed
      const { AgentManager: FreshAgentManager } = await vi.importActual('./agentManager');
      new FreshAgentManager(specificTestLogger as CoreLogger);

      expect(specificTestLogger.warn).toHaveBeenCalledWith(expect.stringContaining('OPENAI_API_KEY not found'));
      expect(specificTestLogger.warn).toHaveBeenCalledWith(expect.stringContaining('ANTHROPIC_API_KEY not found'));
    });
  });

  describe('Agent Registration and Retrieval', () => {
    const agentRegRequest: AgentRegistrationRequest = {
      name: 'Test Agent', type: AgentType.CONTENT_GENERATION,
      capabilities: [AgentCapability.CONTENT_GENERATION],
      modelProvider: ModelProvider.OPENAI, modelName: 'gpt-4',
    };
    beforeEach(()=> { mockInjectedLogger.info.mockClear(); });
    it('should register a new agent', () => {
      const agent = agentManagerInstance.registerAgent(agentRegRequest);
      expect(agent.name).toBe(agentRegRequest.name);
      expect(agentManagerInstance.getAgent(agent.id)).toEqual(agent);
      expect(mockInjectedLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Registered agent ${agent.id}`));
    });
    // ... (Full content of other tests in this block)
    it('should retrieve all agents', () => {
      agentManagerInstance.registerAgent(agentRegRequest);
      agentManagerInstance.registerAgent({ ...agentRegRequest, name: 'Test Agent 2' });
      expect(agentManagerInstance.getAllAgents()).toHaveLength(2);
    });
    it('should find agents by capability', () => {
      agentManagerInstance.registerAgent(agentRegRequest);
      const found = agentManagerInstance.findAgentsByCapability(AgentCapability.CONTENT_GENERATION);
      expect(found).toHaveLength(1); expect(found[0].name).toBe(agentRegRequest.name);
    });
    it('should find agents by type', () => {
      agentManagerInstance.registerAgent(agentRegRequest);
      const found = agentManagerInstance.findAgentsByType(AgentType.CONTENT_GENERATION);
      expect(found).toHaveLength(1); expect(found[0].name).toBe(agentRegRequest.name);
    });
    it('should find idle agents by capability', () => {
      const agent = agentManagerInstance.registerAgent(agentRegRequest);
      const idleAgents = agentManagerInstance.findIdleAgentsByCapability(AgentCapability.CONTENT_GENERATION);
      expect(idleAgents[0].id).toBe(agent.id);
    });
  });

  describe('Agent Status and Removal', () => {
    let agentId: string;
    beforeEach(() => {
      const agent = agentManagerInstance.registerAgent({
        name: 'Status Agent', type: AgentType.ANALYTICS,
        capabilities: [AgentCapability.ANALYTICS],
        modelProvider: ModelProvider.CUSTOM, modelName: 'custom-model'
      });
      agentId = agent.id;
      mockInjectedLogger.info.mockClear();
    });
    it('should update agent status', () => {
      agentManagerInstance.updateAgentStatus(agentId, AgentStatus.BUSY);
      expect(agentManagerInstance.getAgent(agentId)?.status).toBe(AgentStatus.BUSY);
      expect(mockInjectedLogger.info).toHaveBeenCalledWith(`Updated agent ${agentId} status to ${AgentStatus.BUSY}`);
    });
    it('should remove an agent', () => {
      agentManagerInstance.removeAgent(agentId);
      expect(agentManagerInstance.getAgent(agentId)).toBeUndefined();
      expect(mockInjectedLogger.info).toHaveBeenCalledWith(`Removed agent ${agentId}`);
    });
  });

  describe('getAgentStats', () => {
    it('should return correct agent statistics', () => {
      agentManagerInstance.registerAgent({ name: 'A1', type: AgentType.CONTENT_GENERATION, capabilities: [], modelProvider: ModelProvider.OPENAI, modelName: 'g1'});
      agentManagerInstance.registerAgent({ name: 'A2', type: AgentType.BRAND_CONTEXT, capabilities: [], modelProvider: ModelProvider.ANTHROPIC, modelName: 'c1'});
      const stats = agentManagerInstance.getAgentStats();
      expect(stats.totalAgents).toBe(2);
      expect(stats.agentsByType[AgentType.CONTENT_GENERATION]).toBe(1);
      expect(stats.agentsByStatus[AgentStatus.IDLE]).toBe(2);
    });
  });

  describe('executeAgent', () => {
    let agent: Agent;
    const execRequest: Omit<AgentExecutionRequest, 'agentId'> = { prompt: 'Test prompt' };
    beforeEach(() => {
       agent = agentManagerInstance.registerAgent({
        name: 'Exec Agent OpenAI', type: AgentType.CONTENT_GENERATION,
        capabilities: [AgentCapability.CONTENT_GENERATION],
        modelProvider: ModelProvider.OPENAI, modelName: 'gpt-4-test'
      });
       mockInjectedLogger.info.mockClear();
       mockInjectedLogger.warn.mockClear();
       mockInjectedLogger.error.mockClear();
    });
    it('should return error if agent not found', async () => {
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: 'non-existent-id' });
      expect(result.success).toBe(false);
    });
    it('should return error if agent is busy', async () => {
      agentManagerInstance.updateAgentStatus(agent.id, AgentStatus.BUSY);
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: agent.id });
      expect(result.success).toBe(false);
    });
    it('should execute OpenAI agent successfully', async () => {
      mockOpenAIChatCompletionsCreate_SPY.mockResolvedValue({ choices: [{ message: { content: 'OpenAI response' }}], usage: {} });
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: agent.id });
      expect(result.success).toBe(true);
      expect(result.output).toBe('OpenAI response');
      expect(mockInjectedLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Executing agent ${agent.id}`));
    });
    it('should execute Anthropic agent successfully', async () => {
      const anthropicAgent = agentManagerInstance.registerAgent({ name: 'Exec Anthropic', type: AgentType.CONTENT_GENERATION, capabilities: [], modelProvider: ModelProvider.ANTHROPIC, modelName: 'claude-test'});
      mockInjectedLogger.info.mockClear();
      mockAnthropicMessagesCreate_SPY.mockResolvedValue({ content: [{ type: 'text', text: 'Anthropic response' }], usage: {input_tokens:0, output_tokens:0} });
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: anthropicAgent.id });
      expect(result.success).toBe(true);
    });
    it('should execute Ollama agent successfully', async () => {
      const ollamaAgent = agentManagerInstance.registerAgent({ name: 'Exec Ollama', type: AgentType.CONTENT_GENERATION, capabilities: [], modelProvider: ModelProvider.OLLAMA, modelName: 'llama3-test'});
      mockInjectedLogger.info.mockClear();
      mockedFetch.mockResolvedValue({ ok: true, json: async () => ({ message: { content: 'Ollama response' }, usage: {} }) } as Response);
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: ollamaAgent.id });
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalled();
    });
    it('should execute Custom agent successfully', async () => {
      const customAgent = agentManagerInstance.registerAgent({ name: 'Exec Custom', type: AgentType.CONTENT_GENERATION, capabilities: [], modelProvider: ModelProvider.CUSTOM, modelName: 'custom-model'});
      mockInjectedLogger.warn.mockClear();
      const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: customAgent.id });
      expect(result.success).toBe(true);
      expect(mockInjectedLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Custom model execution for agent ${customAgent.id}`));
    });
    it('should handle OpenAI execution error', async () => {
        mockOpenAIChatCompletionsCreate_SPY.mockRejectedValue(new Error('OpenAI API Error'));
        mockInjectedLogger.error.mockClear();
        const result = await agentManagerInstance.executeAgent({ ...execRequest, agentId: agent.id });
        expect(result.success).toBe(false);
        expect(result.error).toBe('OpenAI API Error');
        expect(mockInjectedLogger.error).toHaveBeenCalledWith(expect.stringContaining(`OpenAI execution error for agent ${agent.id}`), expect.any(Error));
    });
  });

  describe('Singleton Logic (initializeAgentManager, getAgentManager)', () => {
    beforeEach(async () => {
      vi.resetModules();
      const core = await import('@monorepo/core');
      (core.createLogger as vi.Mock).mockImplementation(() => ({
        info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
      }));
      const envUtils = await import('../utils/environment');
      (envUtils.getOptionalEnv as vi.Mock).mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'REGISTER_DEFAULT_AGENTS') return 'true';
        if (key === 'OPENAI_API_KEY') return 'fake-key';
        if (key === 'ANTHROPIC_API_KEY') return 'fake-key';
        return defaultValue;
      });
      (OpenAI_SDK as vi.Mock).mockImplementation(() => ({ chat: { completions: { create: mockOpenAIChatCompletionsCreate_SPY } } }));
      (Anthropic_SDK as vi.Mock).mockImplementation(() => ({ messages: { create: mockAnthropicMessagesCreate_SPY } }));
    });
    it('getAgentManager should throw if not initialized', async () => {
      const { getAgentManager: getMgr } = await import('./agentManager');
      expect(() => getMgr()).toThrow('Agent Manager not initialized');
    });
    it('initializeAgentManager should create and return an instance', async () => {
      // This will call new AgentManager() which will use the mocked createLogger
      // from the main @monorepo/core mock, which returns a new set of spies.
      const { initializeAgentManager: initMgr, getAgentManager: getMgr, AgentManager: AM_Class } = await import('./agentManager');
      const manager = await initMgr(); // No logger passed, so AgentManager creates its default
      expect(manager).toBeInstanceOf(AM_Class);
      expect(getMgr()).toBe(manager);
    });
     it('initializeAgentManager should return existing instance if already initialized', async () => {
      const { initializeAgentManager: initMgr } = await import('./agentManager');
      const manager1 = await initMgr();
      const manager2 = await initMgr();
      expect(manager2).toBe(manager1);
    });
  });
});
