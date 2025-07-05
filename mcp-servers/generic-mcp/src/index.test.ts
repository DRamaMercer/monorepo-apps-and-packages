import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { GenericMCPService } from './index';
import { ServerConfig } from '@modelcontextprotocol/runtime';
// Import DEFAULT_PORTS directly for use in test assertions if needed,
// but the mock will ensure the SUT gets the right one.
import { DEFAULT_PORTS as ACTUAL_DEFAULT_PORTS, Logger as CoreLogger } from '@monorepo/core';

// --- Mock Dependencies ---
vi.mock('@monorepo/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@monorepo/core')>();
  return {
    ...original,
    createLogger: vi.fn().mockImplementation(() => ({ // Self-contained mock
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
    // Ensure DEFAULT_PORTS is correctly passed through from the original module
    DEFAULT_PORTS: original.DEFAULT_PORTS || { GENERIC_MCP: 3007 }, // Provide fallback if needed
  };
});

vi.mock('@hono/node-server', () => ({
  serve: vi.fn(),
}));

describe('GenericMCPService & Server', () => {
  let app: Hono;
  let serviceConfig: ServerConfig;
  let mockInjectedLogger: { info: vi.Mock, warn: vi.Mock, error: vi.Mock, debug: vi.Mock };

  beforeEach(async () => {
    vi.resetAllMocks();

    mockInjectedLogger = {
      info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    };

    // If generic-mcp/index.ts's module-scope logger needs specific mock behavior for some tests,
    // this is where it would be set on the imported (mocked) createLogger.
    // For now, the default self-contained mock in vi.mock should suffice.
    const core = await import('@monorepo/core');
    (core.createLogger as vi.Mock).mockImplementation(() => mockInjectedLogger); // Ensure service gets this one

    app = new Hono();
    serviceConfig = {
      name: 'test-generic-mcp',
      version: '1.0.0',
      description: 'Test Generic MCP',
    };
  });

  describe('GenericMCPService Tool Handlers', () => {
    let serviceInstance: GenericMCPService;

    beforeEach(() => {
      // Instantiate service with the specific mockInjectedLogger for method testing
      // This assumes GenericMCPService is imported from './index' which might re-evaluate module scope.
      // For direct class testing, ensure it's the class itself.
      // The `index.ts` exports the class.
      serviceInstance = new GenericMCPService(app, serviceConfig, mockInjectedLogger as CoreLogger);
    });

    it('greetUser tool should return a greeting and log info', async () => {
      const input = { name: 'Tester' };
      const result = await serviceInstance.greetUser(input);

      expect(result.greeting).toBe('Hello, Tester from Generic MCP Server!');
      expect(mockInjectedLogger.info).toHaveBeenCalledWith('Received greet_user request for: Tester');
    });

    it('getExampleData resource should return data and log info', async () => {
      const result = await serviceInstance.getExampleData();

      expect(result.data).toBe('This is some example data from Generic MCP Server.');
      expect(mockInjectedLogger.info).toHaveBeenCalledWith('Received get_example_data request');
    });
  });

  describe('Server Startup (from index.ts)', () => {
    it('should configure and start the server via serve() using default port', async () => {
      vi.resetModules(); // Reset modules to ensure index.ts runs its module scope code with current mocks

      // Ensure createLogger mock is set up for the module scope of index.ts when it's re-imported
      const { createLogger: M_CREATE_LOGGER, DEFAULT_PORTS: M_DEFAULT_PORTS } = await import('@monorepo/core');
      const moduleScopeLoggerSpies = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      (M_CREATE_LOGGER as vi.Mock).mockReturnValue(moduleScopeLoggerSpies);

      await import('./index'); // This executes index.ts

      expect(serve).toHaveBeenCalledOnce(); // Check this first

      const serveCall = (serve as vi.Mock).mock.calls[0];
      expect(serveCall).toBeDefined(); // Ensure the call itself was captured

      const serveOptions = serveCall[0]; // First argument to serve()
      const serveCallback = serveCall[1]; // Second argument to serve()

      expect(serveOptions).toBeDefined();
      expect(serveOptions).toHaveProperty('fetch');
      expect(serveOptions.port).toBe(3007); // Assert against the known default value

      expect(serveCallback).toBeInstanceOf(Function);
      serveCallback({ address: 'localhost', port: 3007 }); // Call the callback with mock info
      // Assert against the spies of the logger instance that was created by index.ts's module scope
      expect(moduleScopeLoggerSpies.info).toHaveBeenCalledWith(
        `Generic MCP Server running on http://localhost:3007`
      );
    });

     it('should use process.env.PORT if available', async () => {
      process.env.PORT = '4000';

      vi.resetModules();
      // Re-establish createLogger mock for this fresh module evaluation
      const { createLogger: M_CREATE_LOGGER_FOR_PORT_TEST } = await import('@monorepo/core');
      (M_CREATE_LOGGER_FOR_PORT_TEST as vi.Mock).mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() });


      await import('./index');

      expect(serve).toHaveBeenCalledOnce();
      const serveOptions = (serve as vi.Mock).mock.calls[0][0];
      expect(serveOptions.port).toBe(4000);

      delete process.env.PORT;
    });
  });
});
