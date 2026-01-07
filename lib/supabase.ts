import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Database types for type-safe queries
 */
export interface Database {
  public: {
    Tables: {
      handles: {
        Row: {
          id: string;
          handle: string;
          status: 'pending' | 'hydrating' | 'complete' | 'error';
          at_proto_data: any | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          handle: string;
          status?: 'pending' | 'hydrating' | 'complete' | 'error';
          at_proto_data?: any | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          status?: 'pending' | 'hydrating' | 'complete' | 'error';
          at_proto_data?: any | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      records: {
        Row: {
          id: number;
          handle_id: string;
          collection: string;
          timestamp: string;
        };
        Insert: {
          id?: number;
          handle_id: string;
          collection: string;
          timestamp: string;
        };
        Update: {
          id?: number;
          handle_id?: string;
          collection?: string;
          timestamp?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_collection_totals: {
        Args: {
          p_handle_id: string;
        };
        Returns: Array<{
          collection: string;
          total: number;
        }>;
      };
    };
  };
}

/**
 * Create a Supabase client for server-side operations
 * Uses service role key to bypass RLS
 */
export function createServerClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client for client-side operations
 * Uses anon key with RLS enabled
 */
export function createBrowserClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
