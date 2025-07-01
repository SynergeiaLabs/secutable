'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in development mode and should use mock auth
    const useMockAuth = process.env.NODE_ENV === 'development' && 
                       process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

    if (useMockAuth) {
      // Mock user for development testing only
      const mockUser = {
        id: 'mock-user-id',
        email: 'mock@example.com',
        created_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        phone: undefined,
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        factors: []
      } as User;

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token-placeholder',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
    } else {
      // Production authentication flow
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signOut = async () => {
    if (process.env.NODE_ENV === 'development' && 
        process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true') {
      // Mock sign out for development
      setUser(null);
      setSession(null);
    } else {
      // Production sign out
      await supabase.auth.signOut();
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 