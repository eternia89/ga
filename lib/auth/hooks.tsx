'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { UserProfileWithJoins, Permission } from './types';
import { hasPermission } from './permissions';

// Auth context type
type AuthContextType = {
  user: User | null;
  profile: UserProfileWithJoins | null;
  isLoading: boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
type AuthProviderProps = {
  initialProfile: UserProfileWithJoins;
  children: ReactNode;
};

// AuthProvider component
export function AuthProvider({ initialProfile, children }: AuthProviderProps) {
  const [profile, setProfile] = useState<UserProfileWithJoins | null>(initialProfile);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        }

        // Check if user is null (session expired)
        if (!session?.user && event !== 'SIGNED_OUT') {
          router.push('/login?error=session_expired');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// useUser hook
export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  return context;
}

// usePermission hook - convenience wrapper
export function usePermission(permission: Permission): boolean {
  const { profile } = useUser();
  if (!profile) return false;
  return hasPermission(profile.role, permission);
}
