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

  // Emergency fallback: force loading to false after 1 second
  React.useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('Emergency timeout triggered - setting loading to false');
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  const refreshUser = async () => {
    try {
      console.log('refreshUser called');
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log('No Supabase URL configured');
        setUser(null);
        return;
      }

      console.log('Supabase URL configured, getting session...');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Try to get user from localStorage as fallback
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);

          // Try to get updated profile data using the stored user ID
          if (userData.id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select(
                'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
              )
              .eq('user_id', userData.id)
              .single();

            // Get business profile data using admin client to bypass RLS
            let businessProfileData = null;
            try {
              const { data: businessData } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', userData.id)
                .single();
              businessProfileData = businessData;
              console.log(
                'Business profile loaded in localStorage fallback:',
                businessProfileData
              );
            } catch (error) {
              // Business profile might not exist yet, that's okay
              console.log(
                'No business profile found for user in localStorage fallback'
              );
            }

            if (profileData) {
              const updatedUser = {
                ...userData,
                profile: profileData,
                business_profile: businessProfileData,
              };
              console.log(
                'Setting user with business profile in localStorage fallback:',
                updatedUser
              );
              setUser(updatedUser);
              return;
            } else if (businessProfileData) {
              // Handle case where there's business profile data but no profile data
              const updatedUser = {
                ...userData,
                business_profile: businessProfileData,
              };
              console.log(
                'Setting user with only business profile in localStorage fallback:',
                updatedUser
              );
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

      // Get updated profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, avatar_url, timezone, phone, address, bio, location'
        )
        .eq('user_id', session.user.id)
        .single();

      // Get business profile data using admin client to bypass RLS
      let businessProfileData = null;
      try {
        const { data: businessData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        businessProfileData = businessData;
        console.log('Business profile loaded in useAuth:', businessProfileData);
      } catch (error) {
        // Business profile might not exist yet, that's okay
        console.log('No business profile found for user');
      }

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
          console.log(
            'Setting user with business profile in useAuth:',
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
            business_profile: businessProfileData,
          };
          console.log(
            'Setting fallback user with business profile in useAuth:',
            fallbackUser
          );
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
          console.log(
            'Setting user with only business profile in useAuth:',
            updatedUser
          );
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
      console.log('Fallback timeout triggered - forcing loading to false');
      setIsLoading(false);
    }, 2000);

    // Check for existing session on mount and refresh user data
    const checkSession = async () => {
      try {
        console.log('checkSession called');
        // Check if we're in the browser (localStorage is available)
        if (typeof window === 'undefined') {
          console.log('Not in browser environment');
          setUser(null);
          setIsLoading(false);
          clearTimeout(fallbackTimeout);
          return;
        }

        // Check for bypass flag first
        const bypassAuthLoading = localStorage.getItem('bypass_auth_loading');
        if (bypassAuthLoading === 'true') {
          console.log('Bypass flag detected - skipping auth check');
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
