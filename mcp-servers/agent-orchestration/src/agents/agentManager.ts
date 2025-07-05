import { createLogger, Logger as CoreLogger } from '@monorepo/core'; // Import Logger type
import { getOptionalEnv } from '../utils/environment';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

// Module-scoped logger is removed. Logger will be an instance property.

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
 * Type definition for Ollama chat API response
 */
interface OllamaChatResponse {
  message?: {
    content: string;
  };
  usage?: {
    prompt_eval_count: number;
    eval_count: number;
    total_eval_count: number;
  };
}

/**
 * Agent Manager class for managing AI agents
 */
export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<string>> = new Map();
  private typeIndex: Map<AgentType, Set<string>> = new Map();
  private modelProviderIndex: Map<ModelProvider, Set<string>> = new Map();

  private openaiClient: OpenAI | undefined;
  private anthropicClient: Anthropic | undefined;
  private readonly logger: CoreLogger; // Instance logger
  // private ollamaClient: any; // Placeholder for Ollama client

  constructor(logger?: CoreLogger) {
    this.logger = logger || createLogger({ serviceName: 'agent-orchestration-mcp', defaultMeta: { component: 'agentManager' } });
    this.logger.info('Agent Manager created');
    
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

    // Initialize OpenAI client
    const openaiApiKey = getOptionalEnv('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. OpenAI agent execution will be simulated.');
    }

    // Initialize Anthropic client
    const anthropicApiKey = getOptionalEnv('ANTHROPIC_API_KEY');
    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not found. Anthropic agent execution will be simulated.');
    }

    // Initialize Ollama client (placeholder)
    // const ollamaBaseUrl = getOptionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
    // if (ollamaBaseUrl) {
    //   this.ollamaClient = new Ollama({ baseUrl: ollamaBaseUrl }); // Assuming an Ollama SDK exists
    // } else {
    //   this.logger.warn('OLLAMA_BASE_URL not found. Ollama agent execution will be simulated.');
    // }
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
    
    this.logger.info(`Registered agent ${agentId} of type ${agent.type}`);
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
      
      this.logger.info(`Executing agent ${request.agentId} of type ${agent.type}`);
      
      // Implement actual execution logic based on the agent type and model provider
      // For this example, we'll just simulate execution
      const startTime = Date.now();
      
      // Simulate different execution paths based on model provider
      let result: AgentExecutionResult;
      
      switch (agent.modelProvider) {
        case ModelProvider.OPENAI:
          result = await this.executeOpenAI(agent, request);
          break;
        case ModelProvider.ANTHROPIC:
          result = await this.executeAnthropic(agent, request);
          break;
        case ModelProvider.OLLAMA:
          result = await this.executeOllama(agent, request);
          break;
        case ModelProvider.CUSTOM:
          result = await this.executeCustom(agent, request);
          break;
        default:
          result = {
            agentId: agent.id,
            success: false,
            error: `Unsupported model provider: ${agent.modelProvider}`
          };
      }
      
      // Calculate execution duration
      const duration = Date.now() - startTime;
      result.duration = duration;
      
      // Update agent status back to idle
      agent.status = AgentStatus.IDLE;
      
      return result;
    } catch (error) {
      this.logger.error(`Error executing agent ${request.agentId}:`, error);
      
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
   * Execute with OpenAI API
   */
  private async executeOpenAI(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    if (!this.openaiClient) {
      return {
        agentId: agent.id,
        success: false,
        error: 'OpenAI client not initialized. Missing API key.'
      };
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        messages: [
          { role: 'system', content: request.systemInstructions || 'You are a helpful AI agent.' },
          { role: 'user', content: request.prompt }
        ],
        model: agent.modelName,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1024,
        // tools: request.tools // Enable if tools are supported by the agent and model
      });

      const output = completion.choices[0]?.message?.content || '';
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
      this.logger.error(`OpenAI execution error for agent ${agent.id}:`, error);
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
  private async executeAnthropic(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    if (!this.anthropicClient) {
      return {
        agentId: agent.id,
        success: false,
        error: 'Anthropic client not initialized. Missing API key.'
      };
    }

    try {
      const response = await this.anthropicClient.messages.create({
        model: agent.modelName,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        system: request.systemInstructions || 'You are a helpful AI agent.',
        messages: [
          { role: 'user', content: request.prompt }
        ]
      });

      const output = response.content.map(block => block.text).join('\n');
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
      this.logger.error(`Anthropic execution error for agent ${agent.id}:`, error);
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
  private async executeOllama(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    const ollamaBaseUrl = getOptionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
    try {
      const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.modelName,
          messages: [
            { role: 'system', content: request.systemInstructions || 'You are a helpful AI agent.' },
            { role: 'user', content: request.prompt }
          ],
          options: {
            temperature: request.temperature || 0.7,
            num_ctx: request.maxTokens || 1024, // Ollama uses num_ctx for context window size, which is similar to max_tokens
          },
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: OllamaChatResponse = await response.json();
      const output = data.message?.content || '';
      const usage = data.usage || { prompt_eval_count: 0, eval_count: 0, total_eval_count: 0 };

      return {
        agentId: agent.id,
        success: true,
        output,
        usage: {
          promptTokens: usage.prompt_eval_count, // Ollama uses prompt_eval_count for prompt tokens
          completionTokens: usage.eval_count,    // Ollama uses eval_count for completion tokens
          totalTokens: usage.total_eval_count     // Ollama uses total_eval_count for total tokens
        },
        metadata: {
          model: agent.modelName,
          brand: request.brandContext,
        }
      };
    } catch (error) {
      this.logger.error(`Ollama execution error for agent ${agent.id}:`, error);
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
  private async executeCustom(
    agent: Agent,
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    this.logger.warn(`Custom model execution for agent ${agent.id} is being handled generically.`);
    // This could be extended to handle various custom API endpoints or local models
    // For now, it acts as a placeholder for future custom integrations.
    // You might integrate with a dynamic loader or a configuration-driven API client here.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API latency
    
    return {
      agentId: agent.id,
      success: true,
      output: `[Custom Model] Processed: ${request.prompt} with model ${agent.modelName}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: Math.floor(request.prompt.length / 5), // Arbitrary
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
  public updateAgentStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return false;
    }
    
    agent.status = status;
    agent.lastActive = new Date();
    
    this.logger.info(`Updated agent ${agentId} status to ${status}`);
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
    
    this.logger.info(`Removed agent ${agentId}`);
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
export async function initializeAgentManager(logger?: CoreLogger): Promise<AgentManager> {
  if (!agentManager) {
    // Pass the provided logger (or undefined if not provided) to the constructor
    agentManager = new AgentManager(logger);
    
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
      
      // agentManager now has its own logger instance (this.logger)
      // If we want initializeAgentManager to log, it would need its own logger,
      // or use the one from the created agentManager instance.
      agentManager.logger.info('Registered default agents'); // Use the instance's logger
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
