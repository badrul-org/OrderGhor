import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Auth features will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export interface Profile {
  id: string;
  email: string;
  business_name: string;
  phone: string;
  license_type: 'trial' | 'starter' | 'pro' | 'business';
  is_admin: boolean;
  created_at: string;
}

export interface ActivationRequest {
  id: string;
  user_id: string;
  plan: 'starter' | 'pro' | 'business';
  transaction_id: string;
  payment_method: 'bkash' | 'nagad' | 'rocket';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  // joined from profiles
  profiles?: {
    email: string;
    business_name: string;
    phone: string;
  };
}
