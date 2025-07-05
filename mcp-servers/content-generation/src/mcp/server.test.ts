import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { ContentGenerationService, createMCPServer } from './server'; // Import the service and factory
import { ServerConfig, MCPTool, MCPResource } from '@modelcontextprotocol/runtime';
import { Logger as CoreLogger } from '@monorepo/core';
import { z } from 'zod';

// Mock for @monorepo/core only if createMCPServer itself calls createLogger for a default
// If createMCPServer always expects a logger, this might not be needed for it.
// However, ContentGenerationService might create a default if one isn't passed to createMCPServer then to it.
// For testing the class directly, we inject a mock logger.
const mockLoggerInstance = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};
vi.mock('@monorepo/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@monorepo/core')>();
  return {
    ...original,
    createLogger: vi.fn(() => mockLoggerInstance),
    // Keep other exports like DEFAULT_PORTS if they are used by SUT indirectly
    DEFAULT_PORTS: original.DEFAULT_PORTS || {},
  };
});


describe('ContentGenerationService MCP Tools & Resources', () => {
  let app: Hono;
  let serviceConfig: ServerConfig;
  let serviceInstance: ContentGenerationService;
  let injectedMockLogger: { info: vi.Mock, warn: vi.Mock, error: vi.Mock, debug: vi.Mock };

  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks

    // Setup the logger that will be injected into ContentGenerationService
    injectedMockLogger = {
      info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()
    };

    app = new Hono();
    serviceConfig = {
      name: 'test-content-generation-mcp',
      version: '1.0.0',
      description: 'Test Content Generation MCP',
    };

    // Instantiate service with the injected mockLogger
    serviceInstance = new ContentGenerationService(app, serviceConfig, injectedMockLogger as CoreLogger);
  });

  // Helper to get a tool's function from the service instance
  function getToolFunc(instance: ContentGenerationService, toolName: string): ((input: any, context?: any) => Promise<any>) | undefined {
    const tools = (instance as any).tools as MCPTool[]; // Accessing protected 'tools'
    const tool = tools.find(t => t.name === toolName);
    return tool?.handler;
  }

  // Helper to get a resource's get function
  function getResourceGetFunc(instance: ContentGenerationService, resourceName: string): ((uri: string, context?: any) => Promise<any>) | undefined {
    const resources = (instance as any).resources as MCPResource[]; // Accessing protected 'resources'
    const resource = resources.find(r => r.name === resourceName);
    return resource?.handler; // handler is the 'get' function
  }

  describe('generate_content tool', () => {
    it('should simulate content generation and log info', async () => {
      vi.useFakeTimers(); // For setTimeout
      const toolFunc = getToolFunc(serviceInstance, 'generate_content');
      expect(toolFunc).toBeDefined();

      const input = { prompt: 'Test prompt for content' };
      const promise = toolFunc!(input); // Call it, don't await yet if timeout is involved in a more complex way

      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise; // Now await the result

      expect(injectedMockLogger.info).toHaveBeenCalledWith('Generating content:', input.prompt);
      expect(result.contentId).toEqual(expect.stringMatching(/^gen-/));
      expect(result.generatedContent).toBe(`Generated content for: "${input.prompt}"`);
      expect(result.status).toBe('completed');
      vi.useRealTimers();
    });
  });

  describe('get_content_status tool', () => {
    it('should simulate getting content status and log info', async () => {
      const toolFunc = getToolFunc(serviceInstance, 'get_content_status');
      expect(toolFunc).toBeDefined();

      const input = { contentId: 'gen-test123' };
      const result = await toolFunc!(input);

      expect(injectedMockLogger.info).toHaveBeenCalledWith('Getting content status for ID:', input.contentId);
      expect(result.contentId).toBe(input.contentId);
      expect(result.status).toBe('completed');
      expect(result.generatedContent).toBe('Simulated content');
    });
  });

  describe('content resource', () => {
    it('should simulate fetching a content resource and log info', async () => {
      const resourceGetFunc = getResourceGetFunc(serviceInstance, 'content');
      expect(resourceGetFunc).toBeDefined();

      const uri = 'some/path/to/content-123';
      const result = await resourceGetFunc!(uri);

      expect(injectedMockLogger.info).toHaveBeenCalledWith('Fetching content resource for URI:', uri);
      expect(result.id).toBe('content-123');
      expect(result.prompt).toBe('Simulated prompt');
      expect(result.status).toBe('completed');
    });

    it('should throw error for invalid content URI in resource get', async () => {
      const resourceGetFunc = getResourceGetFunc(serviceInstance, 'content');
      expect(resourceGetFunc).toBeDefined();

      const uri = 'invalidPath'; // Does not contain a slash to pop from
      // This test might need adjustment based on how robust the URI parsing is.
      // The current code `uri.split('/').pop()` on "invalidPath" would return "invalidPath".
      // Let's test an empty URI part after slash
      await expect(resourceGetFunc!('some/path/to/')).rejects.toThrow('Invalid content URI');
    });
  });

  describe('createMCPServer factory', () => {
    it('should create a Hono app with ContentGenerationService initialized', async () => {
        const testLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
        const appInstance = await createMCPServer(testLogger as CoreLogger);

        expect(appInstance).toBeInstanceOf(Hono);
        // Check if the service's initialization log was called (indirectly tests service instantiation)
        expect(testLogger.info).toHaveBeenCalledWith('Content Generation MCP Service initialized.');
    });
  });
});
