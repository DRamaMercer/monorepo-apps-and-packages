import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrandContextDB, initializeSupabase, getSupabaseClient } from './supabaseClient';
import { BrandContext } from './brandContext'; // Assuming this type is defined
import { createLogger } from '@monorepo/core';

// Mock the logger
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

// Mock the Supabase client
const mockSingle = vi.fn();
const mockSelectThen = vi.fn(); // For listAll's .then()

// eq() can lead to .single() or .select().single() or .then() (for listAll with filter)
const mockEq = vi.fn(() => ({
  single: mockSingle,
  select: vi.fn(() => ({ single: mockSingle })),
  then: mockSelectThen
}));

// select() can lead to .eq().single(), .single(), or .then()
const mockSelect = vi.fn(() => ({
  eq: mockEq,
  single: mockSingle,
  then: mockSelectThen
}));

const mockInsert = vi.fn(() => ({ select: mockSelect })); // insert().select().single()
const mockUpdate = vi.fn(() => ({ eq: mockEq })); // update().eq().select().single()
const mockDelete = vi.fn(() => ({ eq: mockEq })); // delete().eq()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  eq: mockEq,
}));

const mockSupabaseClient = {
  from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));


describe('BrandContextDB', () => {
  const testBrandContext: BrandContext = {
    id: 'test-uuid-1',
    name: 'Test Brand',
    slug: 'test-brand',
    voice: { tone: 'friendly', personality: [], audience: [], style: [] },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      status: 'draft',
    },
  };

  beforeEach(async () => { // Make beforeEach async
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSelectThen.mockReset(); // Explicitly reset the .then mock

    // Ensure a fresh client for each test context if needed, though singleton might be tricky
    // Forcing re-initialization of the singleton for testing (not ideal for prod code but helps here)
    // This is a bit of a hack due to the singleton nature of supabaseClient.ts
    const internalModule = await import('./supabaseClient');
    (internalModule as any).supabaseClient = null; // Reset internal singleton

    // Mock environment variables for initializeSupabase
    process.env.SUPABASE_URL = 'http://test-supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    initializeSupabase(); // Initialize with mocks
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
  });

  describe('getById', () => {
    it('should return a brand context if found', async () => {
      mockSingle.mockResolvedValueOnce({ data: testBrandContext, error: null });
      const result = await BrandContextDB.getById('test-uuid-1');
      expect(result).toEqual(testBrandContext);
      expect(mockFrom).toHaveBeenCalledWith('brand_contexts');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-1');
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should return null if not found (error from Supabase)', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found', code: '404' } });
      const result = await BrandContextDB.getById('non-existent-uuid');
      expect(result).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return a brand context if found by slug', async () => {
      mockSingle.mockResolvedValueOnce({ data: testBrandContext, error: null });
      const result = await BrandContextDB.getBySlug('test-brand');
      expect(result).toEqual(testBrandContext);
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-brand'); // from(...).select('*').eq(...).single()
    });
  });

  describe('listAll', () => {
    it('should return an array of brand contexts', async () => {
      const mockData = [testBrandContext, { ...testBrandContext, id: 'test-uuid-2', slug: 'test-brand-2' }];
      // Temporarily simplify mock for this test
      mockSelect.mockReturnValueOnce(Promise.resolve({ data: mockData, error: null }) as any);

      const result = await BrandContextDB.listAll();
      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith('brand_contexts');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should filter by status if provided', async () => {
        const mockData = [testBrandContext];
        // Temporarily simplify mock for this test
        // When eq is called, it should return a promise
        mockEq.mockReturnValueOnce(Promise.resolve({ data: mockData, error: null }) as any);

        const result = await BrandContextDB.listAll('draft');
        expect(result).toEqual(mockData);
        expect(mockEq).toHaveBeenCalledWith('metadata->status', 'draft');
    });

    it('should return an empty array on error', async () => {
      // Temporarily simplify mock for this test
      mockSelect.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'DB error' } }) as any);
      const result = await BrandContextDB.listAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and return a new brand context', async () => {
      mockSingle.mockResolvedValueOnce({ data: testBrandContext, error: null });
      const result = await BrandContextDB.create(testBrandContext);
      expect(result).toEqual(testBrandContext);
      expect(mockFrom).toHaveBeenCalledWith('brand_contexts');
      expect(mockInsert).toHaveBeenCalledWith(testBrandContext);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should return null on creation error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });
      const result = await BrandContextDB.create(testBrandContext);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the brand context', async () => {
      const updatedData = { ...testBrandContext, name: 'Updated Brand Name' };
      mockSingle.mockResolvedValueOnce({ data: updatedData, error: null });
      const result = await BrandContextDB.update('test-uuid-1', updatedData);
      expect(result).toEqual(updatedData);
      expect(mockFrom).toHaveBeenCalledWith('brand_contexts');
      expect(mockUpdate).toHaveBeenCalledWith(updatedData);
      expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-1');
      // The mockEq returns an object with .select(), which returns an object with .single()
      // So we expect mockSingle to have been called ultimately.
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should return true on successful deletion', async () => {
      // delete().eq() returns a promise directly in this mock
      mockEq.mockResolvedValueOnce({ error: null });
      const result = await BrandContextDB.delete('test-uuid-1');
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('brand_contexts');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'test-uuid-1');
    });

    it('should return false on deletion error', async () => {
      mockEq.mockResolvedValueOnce({ error: { message: 'Delete failed' } });
      const result = await BrandContextDB.delete('test-uuid-1');
      expect(result).toBe(false);
    });
  });
});
