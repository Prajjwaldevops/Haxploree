import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (for secure operations)
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Database types
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  total_points: number;
  created_at: string;
}

export interface Bin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  fill_level: number;
  status: 'active' | 'maintenance' | 'full';
  accepted_items: string[];
  address: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  bin_id: string;
  item_type: string;
  weight: number;
  points: number;
  image_url: string;
  created_at: string;
}
