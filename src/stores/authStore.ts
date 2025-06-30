import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    set({ user: data.user });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    set({ user: null });
  },

  initialize: async () => {
    set({ loading: true });
    
    const { data: { user } } = await supabase.auth.getUser();
    set({ user, loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user || null });
    });
  },
}));