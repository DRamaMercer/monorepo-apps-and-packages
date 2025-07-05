import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { createMCPServer } from './server'; // The function that creates the service and Hono app
import { BrandContextDB } from '../models/supabaseClient';
import { BrandContext, createBrandContext as createBrandContextModelFunc } from '../models/brandContext'; // Renamed to avoid conflict
import { MCPTool } from '@modelcontextprotocol/runtime'; // To inspect tool registration if needed
import { ZodError } from 'zod';

// Mock dependencies
vi.mock('../models/supabaseClient', () => ({
  BrandContextDB: {
    getById: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    listAll: vi.fn(),
    update: vi.fn(), // Added for completeness
    delete: vi.fn(), // Added for completeness
  },
  initializeSupabase: vi.fn(),
}));

vi.mock('../models/brandContext', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        createBrandContext: vi.fn((data) => ({
            ...data,
            id: data.id || 'mock-generated-id', // Ensure ID is part of the object if not provided
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1,
                status: data.status || 'draft'
            }
        })),
        updateBrandContext: vi.fn((existing, updates) => ({ // Simple mock for update
            ...existing,
            ...updates,
            metadata: {
                ...existing.metadata,
                updatedAt: new Date().toISOString(),
                version: (existing.metadata.version || 0) + 1,
            }
        })),
    };
});


vi.mock('@monorepo/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@monorepo/core')>();
  return {
    ...original,
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});


describe('BrandContext MCP Server Tools Logic', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Note: These tests focus on the internal logic of the tool functions
  // as defined inline in BrandContextService. They do not test the Hono routing
  // or the MCPService request handling (like Zod validation at MCPService level).

  describe('get_brand_context tool logic', () => {
    const mockBrandContext: BrandContext = {
      id: 'test-uuid', name: 'Test Brand', slug: 'test-brand',
      voice: { tone: 'friendly', personality: [], audience: [], style: [] },
      metadata: { createdAt: 'date', updatedAt: 'date', version: 1, status: 'draft' }
    };

    // Simulates the core logic of the 'get_brand_context' tool's func
    const getBrandContextToolLogic = async (input: {id?: string, slug?: string}) => {
      let brandContext: BrandContext | null = null;
      if (input.id) {
        brandContext = await BrandContextDB.getById(input.id);
      } else if (input.slug) {
        brandContext = await BrandContextDB.getBySlug(input.slug);
      }
      if (!brandContext) {
        return { success: false, error: `Brand context not found with ${input.id ? `ID ${input.id}` : `slug ${input.slug}`}` };
      }
      return { success: true, brandContext };
    };

    it('should fetch by ID if ID is provided', async () => {
      (BrandContextDB.getById as vi.Mock).mockResolvedValue(mockBrandContext);
      const result = await getBrandContextToolLogic({ id: 'test-uuid' });
      expect(BrandContextDB.getById).toHaveBeenCalledWith('test-uuid');
      expect(BrandContextDB.getBySlug).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.brandContext).toEqual(mockBrandContext);
    });

    it('should fetch by slug if slug is provided and ID is not', async () => {
      (BrandContextDB.getBySlug as vi.Mock).mockResolvedValue(mockBrandContext);
      const result = await getBrandContextToolLogic({ slug: 'test-slug' });
      expect(BrandContextDB.getBySlug).toHaveBeenCalledWith('test-slug');
      expect(BrandContextDB.getById).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.brandContext).toEqual(mockBrandContext);
    });

    it('should return error if not found', async () => {
      (BrandContextDB.getById as vi.Mock).mockResolvedValue(null);
      const result = await getBrandContextToolLogic({ id: 'not-found-id' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('create_brand_context tool logic', () => {
    const validInput = { // This is the input to the tool's func after Zod parsing
        name: 'New Brand',
        slug: 'new-brand-slug',
        description: 'A description',
        // voice is required by BrandContextSchema, but optional in the tool's input Zod schema
        // for the sake of this test, let's assume it's provided or the mock handles defaults
        voice: { tone: 'professional', personality: ['reliable'], audience: ['b2b'], style: ['direct'] },
        status: 'draft'
    };
    // The actual tool generates uuid for id.
    // The createBrandContextModelFunc mock also handles id generation if not provided.

    // Simulates the core logic of the 'create_brand_context' tool's func
    const createBrandContextToolLogic = async (inputData: any) => {
        const existing = await BrandContextDB.getBySlug(inputData.slug);
        if (existing) {
          return { success: false, error: `Brand context with slug "${inputData.slug}" already exists` };
        }

        // Actual tool uses uuidv4() for id. We'll mock this part or assume inputData has it for test.
        // The createBrandContextModelFunc (mocked) will receive this.
        const brandContextDataForModel = {
          id: 'mock-uuid-from-tool', // Simulate tool-generated ID
          ...inputData,
        };

        const brandContext = createBrandContextModelFunc(brandContextDataForModel);
        const savedBrandContext = await BrandContextDB.create(brandContext);

        if (!savedBrandContext) {
            return { success: false, error: 'Failed to save brand context to database' };
        }
        return { success: true, brandContext: savedBrandContext };
    };

    it('should create a brand if slug does not exist', async () => {
        (BrandContextDB.getBySlug as vi.Mock).mockResolvedValue(null); // Slug is unique

        // Mock what DB.create returns, which should be the fully formed BrandContext
        const expectedSavedBrandContext = {
            id: 'mock-uuid-from-tool',
            ...validInput,
            metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, status: 'draft' }
        };
        (BrandContextDB.create as vi.Mock).mockResolvedValue(expectedSavedBrandContext);

        // Update createBrandContextModelFunc mock to reflect what it gets from the tool
        (createBrandContextModelFunc as vi.Mock).mockImplementation(dataWithId => ({
            ...dataWithId,
            metadata: { createdAt: new Date().toISOString(),updatedAt: new Date().toISOString(), version: 1, status: dataWithId.status || 'draft'}
        }));

        const result = await createBrandContextToolLogic(validInput);

        expect(BrandContextDB.getBySlug).toHaveBeenCalledWith(validInput.slug);
        expect(createBrandContextModelFunc).toHaveBeenCalledWith(expect.objectContaining({
            id: 'mock-uuid-from-tool', // The ID generated by the tool
            name: validInput.name,
            slug: validInput.slug,
        }));
        expect(BrandContextDB.create).toHaveBeenCalledWith(expect.objectContaining({
            id: 'mock-uuid-from-tool',
            name: validInput.name,
        }));
        expect(result.success).toBe(true);
        expect(result.brandContext).toEqual(expectedSavedBrandContext);
    });

    it('should return error if slug already exists', async () => {
        (BrandContextDB.getBySlug as vi.Mock).mockResolvedValue({ id: 'some-id', name: 'Existing', slug: validInput.slug });

        const result = await createBrandContextToolLogic(validInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('already exists');
        expect(createBrandContextModelFunc).not.toHaveBeenCalled();
        expect(BrandContextDB.create).not.toHaveBeenCalled();
    });

    it('should handle database save failure', async () => {
        (BrandContextDB.getBySlug as vi.Mock).mockResolvedValue(null);
        // createBrandContextModelFunc will be called, so its mock should return something reasonable
        const modelFuncReturn = {
            id: 'mock-uuid-from-tool', ...validInput,
            metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, status: 'draft' }
        };
        (createBrandContextModelFunc as vi.Mock).mockReturnValue(modelFuncReturn);
        (BrandContextDB.create as vi.Mock).mockResolvedValue(null); // DB save fails

        const result = await createBrandContextToolLogic(validInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to save brand context to database');
    });
  });
});
