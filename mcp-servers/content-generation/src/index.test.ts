import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serve } from '@hono/node-server';
import { DEFAULT_PORTS as ACTUAL_DEFAULT_PORTS } from '@monorepo/core';
// We will import createLogger from the mocked @monorepo/core within tests where needed

// Mock @monorepo/core
vi.mock('@monorepo/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@monorepo/core')>();
  return {
    ...original,
    createLogger: vi.fn().mockImplementation(() => ({ // Default self-contained mock
      info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    })),
    DEFAULT_PORTS: original.DEFAULT_PORTS,
  };
});

// Mock @hono/node-server
vi.mock('@hono/node-server', () => ({
  serve: vi.fn(),
}));

// Mock ./mcp/server (specifically createMCPServer)
const MOCK_CREATE_MCP_SERVER_cg_index = vi.fn();
vi.mock('./mcp/server', () => ({
  createMCPServer: MOCK_CREATE_MCP_SERVER_cg_index,
}));

// Mock ./utils/environment to control PORT and ensure required envs are set for its Zod schema
vi.mock('./utils/environment', async (importOriginal) => {
  // Set process.env variables *before* the original module might be evaluated by importOriginal
  // These are for the original environment.ts to not throw during its IIFE Zod parse
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://test-supabase.co';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'fakekey';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fakekey';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';

  const originalEnvModule = await importOriginal<typeof import('./utils/environment')>();

  // The 'environment' export from the mock will be an object whose PORT can be controlled by tests.
  // Other values can come from process.env (which we set above for original module's IIFE)
  // or directly from ACTUAL_DEFAULT_PORTS.
  return {
    ...originalEnvModule, // Include original types like 'Environment' if needed
    get environment() { // Use a getter to make PORT dynamic based on process.env for tests
        return {
            PORT: parseInt(process.env.PORT || String(ACTUAL_DEFAULT_PORTS.CONTENT_GENERATION_MCP)),
            NODE_ENV: process.env.NODE_ENV || 'test',
            SUPABASE_URL: process.env.SUPABASE_URL!,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        };
    }
  };
});


describe('Content Generation MCP Server Startup (index.ts)', () => {
  let loggerSpiesForTest: { info: vi.Mock, warn: vi.Mock, error: vi.Mock, debug: vi.Mock };

  beforeEach(async () => {
    vi.resetAllMocks();

    // Define the spies for the logger that will be created by index.ts's module scope
    loggerSpiesForTest = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

    // Ensure that when createLogger is called (by index.ts), it returns our spy object
    const core = await import('@monorepo/core');
    (core.createLogger as vi.Mock).mockReturnValue(loggerSpiesForTest);

    MOCK_CREATE_MCP_SERVER_cg_index.mockResolvedValue({ fetch: vi.fn() });

    // Set default PORT in process.env for environment.ts to pick up
    // The mock for ./utils/environment will then use this via its getter
    process.env.PORT = String(ACTUAL_DEFAULT_PORTS.CONTENT_GENERATION_MCP);
  });

  afterEach(() => {
    delete process.env.PORT; // Clean up
  })

  it('should call createMCPServer and serve on default port', async () => {
    // Import index.ts to execute its module scope code.
    // This will use the mocks established in beforeEach and at the top level.
    await import('./index');

    const core = await import('@monorepo/core');
    expect(core.createLogger).toHaveBeenCalledWith({ serviceName: 'content-generation-mcp' });
    expect(loggerSpiesForTest.info).toHaveBeenCalledWith('Starting Content Generation MCP Server...');
    expect(MOCK_CREATE_MCP_SERVER_cg_index).toHaveBeenCalledWith(loggerSpiesForTest);

    expect(serve).toHaveBeenCalledOnce();
    const serveCallArgs = (serve as vi.Mock).mock.calls[0];
    const serveOptions = serveCallArgs[0];
    const serveCallback = serveCallArgs[1];

    expect(serveOptions).toHaveProperty('fetch');
    expect(serveOptions.port).toBe(ACTUAL_DEFAULT_PORTS.CONTENT_GENERATION_MCP);

    const listenInfo = { address: 'localhost', port: ACTUAL_DEFAULT_PORTS.CONTENT_GENERATION_MCP };
    serveCallback(listenInfo);
    expect(loggerSpiesForTest.info).toHaveBeenCalledWith(
      `Content Generation MCP Server listening on http://${listenInfo.address}:${listenInfo.port}`
    );
  });

  it('should use process.env.PORT if available', async () => {
    process.env.PORT = '5005'; // Set for this specific test

    // Reset modules to force re-evaluation of index.ts and its import of environment.ts
    vi.resetModules();

    // Re-establish mocks that might be cleared or affected by vi.resetModules()
    const coreAfterReset = await import('@monorepo/core');
    const loggerForThisTestRun = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    (coreAfterReset.createLogger as vi.Mock).mockReturnValue(loggerForThisTestRun);

    const mcpServerModule = await import('./mcp/server');
    (mcpServerModule.createMCPServer as vi.Mock).mockResolvedValue({ fetch: vi.fn() });


    await import('./index'); // index.ts runs, should pick up new process.env.PORT via its environment import

    expect(serve).toHaveBeenCalledOnce();
    const serveOptions = (serve as vi.Mock).mock.calls[0][0];
    expect(serveOptions.port).toBe(5005);

    const serveCallback = (serve as vi.Mock).mock.calls[0][1];
    const listenInfo = { address: 'localhost', port: 5005 };
    serveCallback(listenInfo);
    expect(loggerForThisTestRun.info).toHaveBeenCalledWith( // Assert on the logger used in this specific re-evaluation
      `Content Generation MCP Server listening on http://${listenInfo.address}:${listenInfo.port}`
    );
  });

  it('should exit on server start error', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const testError = new Error('Test server start error');

    vi.resetModules();

    const coreAfterReset = await import('@monorepo/core');
    const loggerForThisErrorRun = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    (coreAfterReset.createLogger as vi.Mock).mockReturnValue(loggerForThisErrorRun);

    const mcpServerModule = await import('./mcp/server');
    (mcpServerModule.createMCPServer as vi.Mock).mockRejectedValue(testError);

    await import('./index');

    expect(loggerForThisErrorRun.error).toHaveBeenCalledWith('Failed to start Content Generation MCP Server:', testError);
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });
});
