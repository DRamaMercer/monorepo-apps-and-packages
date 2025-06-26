import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { BrandContext } from './brandContext';

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client
 */
export function initializeSupabase(): SupabaseClient {
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
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    throw new Error('Supabase client initialization failed');
  }
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
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
  async getById(id: string): Promise<BrandContext | null> {
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
    
    return data as BrandContext;
  },
  
  /**
   * Get a brand context by slug
   */
  async getBySlug(slug: string): Promise<BrandContext | null> {
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
    
    return data as BrandContext;
  },
  
  /**
   * List all brand contexts
   */
  async listAll(status?: 'active' | 'draft' | 'archived'): Promise<BrandContext[]> {
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
    
    return data as BrandContext[];
  },
  
  /**
   * Create a new brand context
   */
  async create(brandContext: BrandContext): Promise<BrandContext | null> {
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
    
    return data as BrandContext;
  },
  
  /**
   * Update an existing brand context
   */
  async update(id: string, brandContext: BrandContext): Promise<BrandContext | null> {
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
    
    return data as BrandContext;
  },
  
  /**
   * Delete a brand context
   */
  async delete(id: string): Promise<boolean> {
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
