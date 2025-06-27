import { SupabaseClient } from '@supabase/supabase-js';
import { BrandContext } from './brandContext';
/**
 * Initialize the Supabase client
 */
export declare function initializeSupabase(): SupabaseClient;
/**
 * Get the Supabase client instance
 */
export declare function getSupabaseClient(): SupabaseClient;
/**
 * Brand context database operations
 */
export declare const BrandContextDB: {
    /**
     * Get a brand context by ID
     */
    getById(id: string): Promise<BrandContext | null>;
    /**
     * Get a brand context by slug
     */
    getBySlug(slug: string): Promise<BrandContext | null>;
    /**
     * List all brand contexts
     */
    listAll(status?: "active" | "draft" | "archived"): Promise<BrandContext[]>;
    /**
     * Create a new brand context
     */
    create(brandContext: BrandContext): Promise<BrandContext | null>;
    /**
     * Update an existing brand context
     */
    update(id: string, brandContext: BrandContext): Promise<BrandContext | null>;
    /**
     * Delete a brand context
     */
    delete(id: string): Promise<boolean>;
};
//# sourceMappingURL=supabaseClient.d.ts.map