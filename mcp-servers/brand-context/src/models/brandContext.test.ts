import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { createBrandContext, updateBrandContext, BrandContextSchema, BrandContext } from './brandContext';
import { createLogger } from '@monorepo/core';

// Mock the logger to prevent console output during tests and allow assertions
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


describe('BrandContext Models', () => {
  // let consoleErrorSpy: any; // Not currently used

  beforeEach(() => {
    // Vitest automatically mocks console, but if explicit spy is needed:
    // consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    // consoleErrorSpy.mockRestore();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('createBrandContext', () => {
    const validBaseData: Omit<BrandContext, 'id' | 'metadata'> = {
      name: 'Test Brand',
      slug: 'test-brand',
      description: 'A test brand description',
      voice: {
        tone: 'friendly',
        personality: ['innovative', 'approachable'],
        audience: ['tech enthusiasts'],
        style: ['clear', 'concise'],
        vocabulary: { preferredTerms: { 'AI': 'Artificial Intelligence' } },
      },
      visual: {
        colors: { primary: '#FF0000' },
        typography: { primaryFont: 'Arial' },
        logo: { primary: 'http://example.com/logo.png' },
      },
      contentGuidelines: {
        paragraphStyle: 'short',
      },
      // id and metadata are handled by createBrandContext
    };

    it('should create a valid brand context with all fields', () => {
      const dataWithId = { ...validBaseData, id: 'test-uuid' };
      // We pass Omit<BrandContext, 'metadata'> & { status?, id? } to createBrandContext.
      // The function itself should handle the id, but our test data here includes it for clarity.
      // The actual function signature for createBrandContext is Omit<BrandContext, 'metadata'>,
      // which means 'id' is part of that Omit if BrandContext has 'id'.
      // Let's adjust based on the actual BrandContextSchema (id is required)
      // and the createBrandContext function signature.

      // createBrandContext expects data: Omit<BrandContext, 'metadata'>
      // BrandContextSchema has id: z.string().uuid()
      // So, 'id' must be provided to createBrandContext.
      const testUUID = uuidv4();
      const inputDataForCreate: Omit<BrandContext, 'metadata'> & { status?: 'active' | 'draft' | 'archived' } = {
        id: testUUID, // Use a valid UUID
        name: 'Test Brand',
        slug: 'test-brand',
        description: 'A test brand description',
        voice: { // Ensure all required fields for voice are present
          tone: 'friendly',
          personality: ['innovative', 'approachable'],
          audience: ['tech enthusiasts'],
          style: ['clear', 'concise'],
          // vocabulary is optional, so it can be omitted or included
        },
        // visual is optional, can be omitted
        // contentGuidelines is optional, can be omitted
        status: 'draft'
      };

      const result = createBrandContext(inputDataForCreate);
      const now = new Date().toISOString();

      expect(result.id).toBe(testUUID);
      expect(result.name).toBe('Test Brand');
      expect(result.slug).toBe('test-brand');
      expect(result.metadata.createdAt).toBe(now);
      expect(result.metadata.updatedAt).toBe(now);
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.status).toBe('draft');
      expect(() => BrandContextSchema.parse(result)).not.toThrow();
    });

    it('should default status to "draft" if not provided', () => {
      const testUUID = uuidv4();
      const inputData: Omit<BrandContext, 'metadata'> = {
        id: testUUID, name: 'Draft Brand', slug: 'draft-brand',
        voice: { tone: 'formal', personality: [], audience: [], style: [] } // All required voice fields
      };
      const result = createBrandContext(inputData);
      expect(result.metadata.status).toBe('draft');
      expect(() => BrandContextSchema.parse(result)).not.toThrow();
    });

    it('should use provided status if valid', () => {
      const testUUID = uuidv4();
      const inputData: Omit<BrandContext, 'metadata'> & { status: 'active' } = {
        id: testUUID, name: 'Active Brand', slug: 'active-brand',
        voice: { tone: 'professional', personality: [], audience: [], style: [] }, // All required voice fields
        status: 'active'
      };
      const result = createBrandContext(inputData);
      expect(result.metadata.status).toBe('active');
      expect(() => BrandContextSchema.parse(result)).not.toThrow();
    });

    it('should throw error for invalid data (e.g. missing required name)', () => {
      // Zod validation happens inside createBrandContext after adding metadata.
      // So, we need to pass data that would become invalid *after* metadata is added,
      // or rather, that is invalid according to BrandContextSchema.
      const invalidData: any = { slug: 'invalid-brand' }; // Missing id, name, voice
      // The logger mock for '@monorepo/core' will catch the logger.error call.
      expect(() => createBrandContext(invalidData)).toThrow('Failed to create brand context: validation error');
    });
  });

  describe('updateBrandContext', () => {
    // Define `now` inside `beforeEach` or within tests that use it, after timers are faked.
    let now: string;
    const testUUID = uuidv4(); // Can remain here as it's just a value

    // Define existingBrandContext structure here, but populate `now` related fields in beforeEach
    let existingBrandContext: BrandContext;

    beforeEach(() => {
      // This `now` will respect the faked timers
      now = new Date().toISOString();
      existingBrandContext = {
        id: testUUID,
        name: 'Old Name',
        slug: 'old-slug',
        description: 'Old description',
        voice: {
          tone: 'formal',
          personality: ['traditional'],
          audience: ['executives'],
          style: ['verbose'],
        },
        metadata: {
          createdAt: new Date('2022-12-01T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2022-12-01T00:00:00.000Z').toISOString(), // This will be overridden by `now` in tests
          version: 1,
          status: 'active',
        },
      };
    });

    // This block was duplicated, removing the second occurrence.
    // The first occurrence of this test case and its preceding 'existingBrandContext'
    // definition (which correctly uses 'now' in its beforeEach) is the one to keep.

    it('should update provided fields and increment version', () => {
      const updates: Partial<Omit<BrandContext, 'id' | 'metadata'>> = {
        name: 'New Name',
        description: 'New description',
      };
      const result = updateBrandContext(existingBrandContext, updates);

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New description');
      expect(result.slug).toBe('old-slug'); // Unchanged
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.updatedAt).toBe(now);
      expect(result.metadata.createdAt).toBe(existingBrandContext.metadata.createdAt); // Unchanged
      expect(() => BrandContextSchema.parse(result)).not.toThrow();
    });

    it('should correctly update nested voice object', () => {
      const updates: Partial<Omit<BrandContext, 'id' | 'metadata'>> = {
        voice: {
          tone: 'casual',
          personality: ['friendly', 'upbeat'],
          audience: ['general public'],
          style: ['short', 'engaging'],
        },
      };
      const result = updateBrandContext(existingBrandContext, updates);
      expect(result.voice.tone).toBe('casual');
      expect(result.voice.personality).toEqual(['friendly', 'upbeat']);
    });

    it('should retain existing fields if not in updates', () => {
      const updates: Partial<Omit<BrandContext, 'id' | 'metadata'>> = {
        name: 'Only Name Updated',
      };
      const result = updateBrandContext(existingBrandContext, updates);
      expect(result.name).toBe('Only Name Updated');
      expect(result.slug).toBe(existingBrandContext.slug);
      expect(result.description).toBe(existingBrandContext.description);
      expect(result.voice).toEqual(existingBrandContext.voice); // Should be deep equal
    });

    it('should throw error if updates result in invalid schema', () => {
      const updates: any = { name: null }; // name is required string
      // The logger mock for '@monorepo/core' will catch the logger.error call.
      expect(() => updateBrandContext(existingBrandContext, updates)).toThrow('Failed to update brand context: validation error');
    });
  });
});
