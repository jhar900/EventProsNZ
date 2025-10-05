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
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  const refreshUser = async () => {
    console.log('refreshUser - Function called!');
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setUser(null);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('refreshUser - Session:', session);
      console.log('refreshUser - Session user:', session?.user);

      if (!session?.user) {
        console.log(
          'refreshUser - No session or user, trying to get user from localStorage'
        );
        // Try to get user from localStorage as fallback
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log('refreshUser - Found user in localStorage:', userData);

          // Try to get updated profile data using the stored user ID
          if (userData.id) {
            console.log(
              'refreshUser - Trying to get updated profile for user ID:',
              userData.id
            );
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select(
                'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
              )
              .eq('user_id', userData.id)
              .single();

            console.log(
              'refreshUser - Profile data from localStorage fallback:',
              profileData
            );
            console.log(
              'refreshUser - Profile error from localStorage fallback:',
              profileError
            );

            if (profileData) {
              const updatedUser = {
                ...userData,
                profile: profileData,
              };
              console.log(
                'refreshUser - Setting user with updated profile from localStorage:',
                updatedUser
              );
              setUser(updatedUser);
              return;
            }
          }

          setUser(userData);
          return;
        } else {
          console.log(
            'refreshUser - No user data in localStorage, setting user to null'
          );
          setUser(null);
          return;
        }
      }

      // Get updated profile data
      console.log(
        'refreshUser - About to query profiles table for user_id:',
        session.user.id
      );
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
        )
        .eq('user_id', session.user.id)
        .single();

      console.log('refreshUser - Profile data:', profileData);
      console.log('refreshUser - Profile error:', profileError);
      console.log('refreshUser - Current user:', user);

      if (profileData) {
        // Always try to get current user data first
        const currentUser =
          user || JSON.parse(localStorage.getItem('user_data') || '{}');

        console.log(
          'refreshUser - Current user from state or localStorage:',
          currentUser
        );

        if (currentUser && currentUser.id) {
          const updatedUser = {
            ...currentUser,
            profile: profileData,
          };
          console.log(
            'refreshUser - Setting user with current data:',
            updatedUser
          );
          setUser(updatedUser);
        } else {
          // Fallback: create a basic user object with the profile data
          const fallbackUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'contractor', // Default role, should be updated from actual user data
            is_verified: false,
            last_login: null,
            profile: profileData,
          };
          console.log('refreshUser - Setting fallback user:', fallbackUser);
          setUser(fallbackUser);
        }
      } else {
        console.log(
          'refreshUser - No profile data found, keeping current user'
        );
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
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
    // Add a fallback timeout to ensure loading state is always set to false
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Check for existing session on mount and refresh user data
    const checkSession = async () => {
      try {
        // Check if we're in the browser (localStorage is available)
        if (typeof window === 'undefined') {
          setUser(null);
          setIsLoading(false);
          clearTimeout(fallbackTimeout);
          return;
        }

        // First check localStorage for user data (instant check)
        const storedUserData = localStorage.getItem('user_data');
        const isAuthenticated = localStorage.getItem('is_authenticated');

        if (storedUserData && isAuthenticated === 'true') {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          setIsLoading(false);
          clearTimeout(fallbackTimeout);

          // Refresh user data from database to get latest profile info
          await refreshUser();
          return;
        }

        setUser(null);
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
      } catch (error) {
        setUser(null);
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
      }
    };

    // Run the session check
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
