'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  last_login: string | null;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    timezone: string;
  };
  business_profile?: {
    id: string;
    company_name: string;
    subscription_tier: string;
    is_verified: boolean;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('useAuth hook called, isLoading:', isLoading, 'user:', user);
  console.log('Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    isPlaceholder:
      process.env.NEXT_PUBLIC_SUPABASE_URL ===
      'https://placeholder.supabase.co',
  });

  const refreshUser = async () => {
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('Supabase not configured - running in demo mode');
        setUser(null);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        return;
      }

      // Get user profile from our database
      const { data: userData, error } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          role,
          is_verified,
          last_login,
          profiles (
            first_name,
            last_name,
            avatar_url,
            timezone
          )
        `
        )
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Failed to fetch user profile:', error);
        setUser(null);
        return;
      }

      // Get business profile if contractor
      let businessProfile = null;
      if (userData.role === 'contractor') {
        const { data: businessData } = await supabase
          .from('business_profiles')
          .select('id, company_name, subscription_tier, is_verified')
          .eq('user_id', session.user.id)
          .single();

        businessProfile = businessData;
      }

      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        is_verified: userData.is_verified,
        last_login: userData.last_login,
        profile: userData.profiles,
        business_profile: businessProfile,
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }

    // Store session data
    if (result.session) {
      localStorage.setItem('access_token', result.session.access_token);
      localStorage.setItem('refresh_token', result.session.refresh_token);
      localStorage.setItem('expires_at', result.session.expires_at);
    }

    setUser(result.user);
  };

  const register = async (userData: {
    email: string;
    password: string;
    role: 'event_manager' | 'contractor';
    first_name: string;
    last_name: string;
  }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    setUser(result.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');

      // Sign out from Supabase
      await supabase.auth.signOut();

      setUser(null);
    }
  };

  useEffect(() => {
    console.log(
      'useEffect called, NEXT_PUBLIC_SUPABASE_URL:',
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        // Check if Supabase is properly configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn('Supabase not configured - running in demo mode');
          setUser(null);
          setIsLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (only if Supabase is configured)
    let subscription;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      });
      subscription = authSubscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
