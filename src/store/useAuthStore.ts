import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;

  initialize: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  signUp: (email: string, password: string, businessName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().loadProfile(session.user.id);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });
        await get().loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, isAdmin: false });
      }
    });
  },

  loadProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ profile: data as Profile, isAdmin: (data as Profile).is_admin });
    }
  },

  signUp: async (email, password, businessName, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName, phone },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Update profile with business info (trigger creates the row, we update it)
    if (data.user) {
      // Small delay to let the trigger create the profile row
      await new Promise((r) => setTimeout(r, 500));
      await supabase
        .from('profiles')
        .update({ business_name: businessName, phone })
        .eq('id', data.user.id);

      set({ user: data.user });
      await get().loadProfile(data.user.id);
    }

    return { error: null };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      set({ user: data.user });
      await get().loadProfile(data.user.id);
    }

    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAdmin: false });
  },
}));
