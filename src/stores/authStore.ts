import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'supplier' | 'manager';

interface Profile {
  full_name: string;
  organization_id: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    // Set up auth state listener BEFORE getting session
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
      });

      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(() => get().fetchProfile(session.user.id), 0);
      } else {
        set({ profile: null, role: null });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    set({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading: false,
    });

    if (session?.user) {
      await get().fetchProfile(session.user.id);
    }
  },

  fetchProfile: async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('full_name, organization_id').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    set({
      profile: profileRes.data ? {
        full_name: profileRes.data.full_name,
        organization_id: profileRes.data.organization_id,
      } : null,
      role: (roleRes.data?.role as UserRole) ?? 'supplier',
    });
  },

  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signup: async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    // Update the profile name and role if user was created
    if (data.user) {
      await Promise.all([
        supabase.from('profiles').update({ full_name: fullName }).eq('user_id', data.user.id),
        // Update role if not supplier (supplier is default from trigger)
        ...(role === 'manager' ? [
          supabase.from('user_roles').update({ role: 'manager' }).eq('user_id', data.user.id),
        ] : []),
      ]);
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, role: null, isAuthenticated: false });
  },

  setSession: (session) => {
    set({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
    });
  },
}));
