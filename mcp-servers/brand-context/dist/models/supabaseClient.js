import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
// Supabase client singleton
let supabaseClient = null;
/**
 * Initialize the Supabase client
 */
export function initializeSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and service key must be provided in environment variables');
    }
    try {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        logger.info('Supabase client initialized');
        return supabaseClient;
    }
    catch (error) {
        logger.error('Failed to initialize Supabase client:', error);
        throw new Error('Supabase client initialization failed');
    }
}
/**
 * Get the Supabase client instance
 */
export function getSupabaseClient() {
    if (!supabaseClient) {
        return initializeSupabase();
    }
    return supabaseClient;
}
/**
 * Brand context database operations
 */
export const BrandContextDB = {
    /**
     * Get a brand context by ID
     */
    async getById(id) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('brand_contexts')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            logger.error(`Error fetching brand context with ID ${id}:`, error);
            return null;
        }
        return data;
    },
    /**
     * Get a brand context by slug
     */
    async getBySlug(slug) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('brand_contexts')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error) {
            logger.error(`Error fetching brand context with slug ${slug}:`, error);
            return null;
        }
        return data;
    },
    /**
     * List all brand contexts
     */
    async listAll(status) {
        const supabase = getSupabaseClient();
        let query = supabase
            .from('brand_contexts')
            .select('*');
        if (status) {
            query = query.eq('metadata->status', status);
        }
        const { data, error } = await query;
        if (error) {
            logger.error('Error fetching brand contexts:', error);
            return [];
        }
        return data;
    },
    /**
     * Create a new brand context
     */
    async create(brandContext) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('brand_contexts')
            .insert(brandContext)
            .select()
            .single();
        if (error) {
            logger.error('Error creating brand context:', error);
            return null;
        }
        return data;
    },
    /**
     * Update an existing brand context
     */
    async update(id, brandContext) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('brand_contexts')
            .update(brandContext)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            logger.error(`Error updating brand context with ID ${id}:`, error);
            return null;
        }
        return data;
    },
    /**
     * Delete a brand context
     */
    async delete(id) {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('brand_contexts')
            .delete()
            .eq('id', id);
        if (error) {
            logger.error(`Error deleting brand context with ID ${id}:`, error);
            return false;
        }
        return true;
    }
};
//# sourceMappingURL=supabaseClient.js.map