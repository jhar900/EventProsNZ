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
    phone?: string;
  };
  business_profile?: {
    id: string;
    company_name: string;
    description?: string;
    website?: string;
    location?: string;
    service_categories?: string[];
    subscription_tier: string;
    is_verified: boolean;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Emergency fallback: force loading to false after 500ms for faster perceived performance
  React.useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  const refreshUser = async () => {
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setUser(null);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Try to get user from localStorage as fallback
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);

          // Try to get updated profile data using the stored user ID (in parallel)
          if (userData.id) {
            const [profileResult, businessProfileResult] = await Promise.all([
              supabase
                .from('profiles')
                .select(
                  'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
                )
                .eq('user_id', userData.id)
                .single(),
              supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', userData.id)
                .maybeSingle(),
            ]);

            const profileData = profileResult.data;
            const businessProfileData = businessProfileResult.data;

            if (profileData) {
              const updatedUser = {
                ...userData,
                profile: profileData,
                business_profile: businessProfileData,
              };
              setUser(updatedUser);
              return;
            } else if (businessProfileData) {
              // Handle case where there's business profile data but no profile data
              const updatedUser = {
                ...userData,
                business_profile: businessProfileData,
              };
              setUser(updatedUser);
              return;
            }
          }

          setUser(userData);
          return;
        } else {
          setUser(null);
          return;
        }
      }

      // Get updated profile data and business profile in parallel
      const [profileResult, businessProfileResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
          )
          .eq('user_id', session.user.id)
          .single(),
        supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ]);

      const profileData = profileResult.data;
      const businessProfileData = businessProfileResult.data;

      if (profileData) {
        // Always try to get current user data first
        const currentUser =
          user || JSON.parse(localStorage.getItem('user_data') || '{}');

        if (currentUser && currentUser.id) {
          const updatedUser = {
            ...currentUser,
            profile: profileData,
            business_profile: businessProfileData,
          };
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
            business_profile: businessProfileData,
          };
          setUser(fallbackUser);
        }
      } else if (businessProfileData) {
        // Handle case where there's business profile data but no profile data
        const currentUser =
          user || JSON.parse(localStorage.getItem('user_data') || '{}');

        if (currentUser && currentUser.id) {
          const updatedUser = {
            ...currentUser,
            business_profile: businessProfileData,
          };
          setUser(updatedUser);
        } else {
          // Fallback: create a basic user object with the business profile data
          const fallbackUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'contractor', // Default role, should be updated from actual user data
            is_verified: false,
            last_login: null,
            business_profile: businessProfileData,
          };
          console.log(
            'Setting fallback user with only business profile in useAuth:',
            fallbackUser
          );
          setUser(fallbackUser);
        }
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
    // Optimistic update: Clear state and localStorage immediately
    // This makes logout feel instant to the user
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('user_data');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('profile_completion_status'); // Clear cached completion status

    // Run logout operations in parallel and don't wait for them
    // This makes logout feel instant while cleanup happens in background
    Promise.all([
      fetch('/api/auth/logout', {
        method: 'POST',
        // Don't wait for response - fire and forget
      }).catch(() => {
        // Ignore errors - we've already cleared local state
      }),
      supabase.auth.signOut().catch(() => {
        // Ignore errors - we've already cleared local state
      }),
    ]).catch(() => {
      // Ignore any errors - logout is already complete from user's perspective
    });
  };

  useEffect(() => {
    // Add a fallback timeout to ensure loading state is always set to false
    // Reduced to 1 second for faster perceived performance
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

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

        // Check for bypass flag first
        const bypassAuthLoading = localStorage.getItem('bypass_auth_loading');
        if (bypassAuthLoading === 'true') {
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

          // Refresh user data from database in background (non-blocking)
          // Don't await - let it happen in the background
          refreshUser().catch(err => {
            console.error('Background user refresh failed:', err);
            // Don't update state on error - keep using cached data
          });
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
