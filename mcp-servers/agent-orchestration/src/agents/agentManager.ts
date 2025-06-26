import { logger } from '../utils/logger';
import { getOptionalEnv } from '../utils/environment';

/**
 * Agent capability types
 */
export enum AgentCapability {
  CONTENT_GENERATION = 'content_generation',
  CONTEXT_VALIDATION = 'context_validation',
  ASSET_MANAGEMENT = 'asset_management',
  ANALYTICS = 'analytics',
  WORKFLOW_ORCHESTRATION = 'workflow_orchestration',
  REASONING = 'reasoning',
  PLANNING = 'planning',
  CODE_GENERATION = 'code_generation'
}

/**
 * Agent status values
 */
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error'
}

/**
 * Agent type definitions
 */
export enum AgentType {
  BRAND_CONTEXT = 'brand_context',
  CONTENT_GENERATION = 'content_generation',
  ANALYTICS = 'analytics',
  ASSET_MANAGEMENT = 'asset_management',
  WORKFLOW_ORCHESTRATION = 'workflow_orchestration'
}

/**
 * Agent model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  CUSTOM = 'custom'
}

/**
 * Agent interface definition
 */
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: AgentStatus;
  modelProvider: ModelProvider;
  modelName: string;
  lastActive?: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent registration request
 */
export interface AgentRegistrationRequest {
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  modelProvider: ModelProvider;
  modelName: string;
  metadata?: Record<string, any>;
}

/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
  agentId: string;
  prompt: string;
  brandContext?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstructions?: string;
  tools?: any[];
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  agentId: string;
  success: boolean;
  output?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Agent Manager class for managing AI agents
 */
export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<string>> = new Map();
  private typeIndex: Map<AgentType, Set<string>> = new Map();
  private modelProviderIndex: Map<ModelProvider, Set<string>> = new Map();

  constructor() {
    logger.info('Agent Manager created');
    
    // Initialize capability index
    Object.values(AgentCapability).forEach(capability => {
      this.capabilityIndex.set(capability, new Set<string>());
    });
    
    // Initialize type index
    Object.values(AgentType).forEach(type => {
      this.typeIndex.set(type, new Set<string>());
    });
    
    // Initialize model provider index
    Object.values(ModelProvider).forEach(provider => {
      this.modelProviderIndex.set(provider, new Set<string>());
    });
  }

  /**
   * Register a new agent
   */
  public registerAgent(request: AgentRegistrationRequest): Agent {
    const agentId = `${request.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const agent: Agent = {
      id: agentId,
      name: request.name,
      type: request.type,
      capabilities: request.capabilities,
      status: AgentStatus.IDLE,
      modelProvider: request.modelProvider,
      modelName: request.modelName,
      lastActive: new Date(),
      metadata: request.metadata || {}
    };
    
    this.agents.set(agentId, agent);
    
    // Update indexes
    agent.capabilities.forEach(capability => {
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
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Find agents by capability
   */
  public findAgentsByCapability(capability: AgentCapability): Agent[] {
    const agentIds = this.capabilityIndex.get(capability) || new Set<string>();
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter(agent => agent !== undefined) as Agent[];
  }

  /**
   * Find agents by type
   */
  public findAgentsByType(type: AgentType): Agent[] {
    const agentIds = this.typeIndex.get(type) || new Set<string>();
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter(agent => agent !== undefined) as Agent[];
  }

  /**
   * Find idle agents with a specific capability
   */
  public findIdleAgentsByCapability(capability: AgentCapability): Agent[] {
    return this.findAgentsByCapability(capability).filter(
      agent => agent.status === AgentStatus.IDLE
    );
  }

  /**
   * Execute a task with an agent
   */
  public async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const agent = this.agents.get(request.agentId);
    
    if (!agent) {
      return {
        agentId: request.agentId,
        success: false,
        error: `Agent with ID ${request.agentId} not found`
      };
    }
    
    if (agent.status === AgentStatus.BUSY) {
      return {
        agentId: request.agentId,
        success: false,
        error: `Agent ${request.agentId} is busy`
      };
    }
    
    try {
      // Update agent status
      agent.status = AgentStatus.BUSY;
      agent.lastActive = new Date();
      
      logger.info(`Executing agent ${request.agentId} of type ${agent.type}`);
      
      // Implement actual execution logic based on the agent type and model provider
      // For this example, we'll just simulate execution
      const startTime = Date.now();
      
      // Simulate different execution paths based on model provider
      let result: AgentExecutionResult;
      
      switch (agent.modelProvider) {
        case ModelProvider.OPENAI:
          result = await this.simulateOpenAIExecution(agent, request);
          break;
        case ModelProvider.ANTHROPIC:
          result = await this.simulateAnthropicExecution(agent, request);
          break;
        case ModelProvider.OLLAMA:
          result = await this.simulateOllamaExecution(agent, request);
          break;
        default:
          result = await this.simulateCustomExecution(agent, request);
      }
      
      // Calculate execution duration
      const duration = Date.now() - startTime;
      result.duration = duration;
      
      // Update agent status back to idle
      agent.status = AgentStatus.IDLE;
      
      return result;
    } catch (error) {
      logger.error(`Error executing agent ${request.agentId}:`, error);
      
      // Update agent status to error
      agent.status = AgentStatus.ERROR;
      
      return {
        agentId: request.agentId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Simulate OpenAI execution (to be replaced with actual implementation)
   */
  private async simulateOpenAIExecution(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      agentId: agent.id,
      success: true,
      output: `[${agent.name}] Processed: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 100,
        totalTokens: request.prompt.length + 100
      },
      metadata: {
        model: agent.modelName,
        brand: request.brandContext
      }
    };
  }

  /**
   * Simulate Anthropic execution (to be replaced with actual implementation)
   */
  private async simulateAnthropicExecution(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      agentId: agent.id,
      success: true,
      output: `[${agent.name}] Processed with Claude: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 120,
        totalTokens: request.prompt.length + 120
      },
      metadata: {
        model: agent.modelName,
        brand: request.brandContext
      }
    };
  }

  /**
   * Simulate Ollama execution (to be replaced with actual implementation)
   */
  private async simulateOllamaExecution(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      agentId: agent.id,
      success: true,
      output: `[${agent.name}] Processed with Ollama: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 80,
        totalTokens: request.prompt.length + 80
      },
      metadata: {
        model: agent.modelName,
        brand: request.brandContext
      }
    };
  }

  /**
   * Simulate custom execution (to be replaced with actual implementation)
   */
  private async simulateCustomExecution(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      agentId: agent.id,
      success: true,
      output: `[${agent.name}] Processed with custom model: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 60,
        totalTokens: request.prompt.length + 60
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
  public updateAgentStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return false;
    }
    
    agent.status = status;
    agent.lastActive = new Date();
    
    logger.info(`Updated agent ${agentId} status to ${status}`);
    return true;
  }

  /**
   * Remove an agent
   */
  public removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return false;
    }
    
    // Remove from all indexes
    agent.capabilities.forEach(capability => {
      this.capabilityIndex.get(capability)?.delete(agentId);
    });
    
    this.typeIndex.get(agent.type)?.delete(agentId);
    this.modelProviderIndex.get(agent.modelProvider)?.delete(agentId);
    
    // Remove from main map
    this.agents.delete(agentId);
    
    logger.info(`Removed agent ${agentId}`);
    return true;
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent stats
   */
  public getAgentStats(): Record<string, any> {
    const totalAgents = this.agents.size;
    const agentsByType = Object.values(AgentType).reduce((acc, type) => {
      acc[type] = this.typeIndex.get(type)?.size || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const agentsByStatus = Object.values(AgentStatus).reduce((acc, status) => {
      acc[status] = Array.from(this.agents.values()).filter(
        agent => agent.status === status
      ).length;
      return acc;
    }, {} as Record<string, number>);
    
    const agentsByModelProvider = Object.values(ModelProvider).reduce((acc, provider) => {
      acc[provider] = this.modelProviderIndex.get(provider)?.size || 0;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalAgents,
      agentsByType,
      agentsByStatus,
      agentsByModelProvider
    };
  }
}

// Singleton instance
let agentManager: AgentManager | null = null;

/**
 * Initialize the agent manager
 */
export async function initializeAgentManager(): Promise<AgentManager> {
  if (!agentManager) {
    agentManager = new AgentManager();
    
    // Register default agents based on configuration
    const registerDefaultAgents = getOptionalEnv('REGISTER_DEFAULT_AGENTS', 'true') === 'true';
    
    if (registerDefaultAgents) {
      // Register brand context agent
      agentManager.registerAgent({
        name: 'Brand Context Manager',
        type: AgentType.BRAND_CONTEXT,
        capabilities: [
          AgentCapability.CONTEXT_VALIDATION,
          AgentCapability.REASONING
        ],
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-4'
      });
      
      // Register content generation agent
      agentManager.registerAgent({
        name: 'Content Generator',
        type: AgentType.CONTENT_GENERATION,
        capabilities: [
          AgentCapability.CONTENT_GENERATION,
          AgentCapability.CODE_GENERATION
        ],
        modelProvider: ModelProvider.ANTHROPIC,
        modelName: 'claude-3-opus-20240229'
      });
      
      // Register workflow orchestration agent
      agentManager.registerAgent({
        name: 'Workflow Orchestrator',
        type: AgentType.WORKFLOW_ORCHESTRATION,
        capabilities: [
          AgentCapability.WORKFLOW_ORCHESTRATION,
          AgentCapability.PLANNING
        ],
        modelProvider: ModelProvider.OPENAI,
        modelName: 'gpt-4-turbo'
      });
      
      // Register analytics agent
      agentManager.registerAgent({
        name: 'Analytics Agent',
        type: AgentType.ANALYTICS,
        capabilities: [
          AgentCapability.ANALYTICS,
          AgentCapability.REASONING
        ],
        modelProvider: ModelProvider.ANTHROPIC,
        modelName: 'claude-3-sonnet-20240229'
      });
      
      // Register asset management agent
      agentManager.registerAgent({
        name: 'Asset Manager',
        type: AgentType.ASSET_MANAGEMENT,
        capabilities: [
          AgentCapability.ASSET_MANAGEMENT
        ],
        modelProvider: ModelProvider.OLLAMA,
        modelName: 'llama3'
      });
      
      logger.info('Registered default agents');
    }
  }
  
  return agentManager;
}

/**
 * Get the agent manager instance
 */
export function getAgentManager(): AgentManager {
  if (!agentManager) {
    throw new Error('Agent Manager not initialized. Call initializeAgentManager() first.');
  }
  
  return agentManager;
}
