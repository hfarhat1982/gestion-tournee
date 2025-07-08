import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  userType?: string; // 'admin' | 'client'
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  userType: undefined,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    set({ user: data.user });
    // Récupère le type de l'utilisateur
    if (data.user) {
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('type')
        .eq('auth_user_id', data.user.id)
        .single();
      set({ userType: customer?.type });
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    set({ user: null, userType: undefined });
  },

  initialize: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    set({ user, loading: false });
    if (user) {
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('type')
        .eq('auth_user_id', user.id)
        .single();
      set({ userType: customer?.type });
    } else {
      set({ userType: undefined });
    }
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        supabase
          .from('customers')
          .select('type')
          .eq('auth_user_id', session.user.id)
          .single()
          .then(({ data: customer }) => {
            set({ userType: customer?.type });
          });
      } else {
        set({ userType: undefined });
      }
    });
  },
}));