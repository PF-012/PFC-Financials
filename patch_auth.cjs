const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const replacement = `import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  app_metadata: {},
  user_metadata: {
    avatar_url: 'https://ui-avatars.com/api/?name=Guest+User',
    full_name: 'Guest User',
    name: 'Guest User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'guest@example.com',
} as User;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? MOCK_USER);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? MOCK_USER);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!isSupabaseConfigured) {
      alert('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to sign in.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`;

fs.writeFileSync('src/context/AuthContext.tsx', replacement);
console.log("Patched AuthContext to bypass login.");
