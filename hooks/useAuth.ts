'use client';

import React, { useState, useEffect } from 'react';
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

  // Emergency fallback: force loading to false after 1 second
  React.useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('Emergency timeout: forcing loading state to false');
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

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
      console.log('refreshUser called');

      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('Supabase not configured - running in demo mode');
        setUser(null);
        return;
      }

      console.log('Getting session from Supabase...');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('Session in refreshUser:', session);

      if (!session?.user) {
        console.log('No session or user found, setting user to null');
        setUser(null);
        return;
      }

      // Get user profile from our database with timeout
      console.log('Fetching user profile from database...');
      const userQueryPromise = supabase
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );

      const { data: userData, error } = (await Promise.race([
        userQueryPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error('Failed to fetch user profile:', error);

        // If user exists in Auth but not in our database, create the record
        if (
          error.code === 'PGRST116' ||
          error.message.includes('No rows found')
        ) {
          console.log(
            'User exists in Auth but not in database, creating user record...'
          );

          // Create user record via API call to avoid RLS issues
          const createUserResponse = await fetch(
            '/api/auth/create-user-profile',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: session.user.id,
                email: session.user.email!,
                role: 'event_manager', // Default role
                first_name:
                  session.user.user_metadata?.full_name?.split(' ')[0] ||
                  'User',
                last_name:
                  session.user.user_metadata?.full_name
                    ?.split(' ')
                    .slice(1)
                    .join(' ') || '',
              }),
            }
          );

          if (!createUserResponse.ok) {
            const errorData = await createUserResponse.json();
            console.error('Failed to create user record:', errorData);
            setUser(null);
            return;
          }

          // Retry fetching the user profile
          const { data: retryUserData, error: retryError } = await supabase
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

          if (retryError) {
            console.error(
              'Failed to fetch user profile after creation:',
              retryError
            );
            setUser(null);
            return;
          }

          setUser({
            id: retryUserData.id,
            email: retryUserData.email,
            role: retryUserData.role,
            is_verified: retryUserData.is_verified,
            last_login: retryUserData.last_login,
            profile: retryUserData.profiles,
            business_profile: null,
          });
          return;
        }

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

    // Store user data in localStorage for persistence
    if (result.user) {
      localStorage.setItem('user_data', JSON.stringify(result.user));
      localStorage.setItem('is_authenticated', 'true');
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

    // Store user data in localStorage for persistence
    if (result.user) {
      localStorage.setItem('user_data', JSON.stringify(result.user));
      localStorage.setItem('is_authenticated', 'true');
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
      localStorage.removeItem('user_data');
      localStorage.removeItem('is_authenticated');

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

    // Add a fallback timeout to ensure loading state is always set to false
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback timeout: forcing isLoading to false');
      setIsLoading(false);
    }, 2000); // Reduced timeout since localStorage is instant

    // Check for existing session on mount
    const checkSession = () => {
      try {
        // Check if we're in the browser (localStorage is available)
        if (typeof window === 'undefined') {
          console.log('Server-side rendering, setting loading to false');
          setUser(null);
          setIsLoading(false);
          clearTimeout(fallbackTimeout);
          return;
        }

        // First check localStorage for user data (instant check)
        const storedUserData = localStorage.getItem('user_data');
        const isAuthenticated = localStorage.getItem('is_authenticated');

        if (storedUserData && isAuthenticated === 'true') {
          console.log(
            'Found user data in localStorage, setting user immediately'
          );
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          setIsLoading(false);
          clearTimeout(fallbackTimeout);
          return;
        }

        console.log('No localStorage data found, user not authenticated');
        setUser(null);
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
      } catch (error) {
        console.error('Error checking localStorage:', error);
        setUser(null);
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
      }
    };

    // Run immediately (no async needed for localStorage)
    checkSession();

    return () => {
      clearTimeout(fallbackTimeout);
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
