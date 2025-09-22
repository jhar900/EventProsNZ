'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  website?: string;
  location?: string;
  service_categories: string[];
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  subscription_tier: 'essential' | 'professional' | 'enterprise';
  business_address?: string;
  nzbn?: string;
  service_areas?: string[];
  social_links?: any;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  user_id: string;
  service_type: string;
  description?: string;
  price_range_min?: number;
  price_range_max?: number;
  availability?: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  video_platform?: string;
  event_date?: string;
  created_at: string;
  updated_at: string;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'contacts_only' | 'private';
  contact_visibility: 'public' | 'contacts_only' | 'private';
  portfolio_visibility: 'public' | 'contacts_only' | 'private';
  business_visibility: 'public' | 'contacts_only' | 'private';
  service_visibility: 'public' | 'contacts_only' | 'private';
}

interface ProfileCompletionStatus {
  personal_info: boolean;
  contact_info: boolean;
  business_info: boolean;
  services: boolean;
  portfolio: boolean;
  overall_completion: number;
}

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [privacySettings, setPrivacySettings] =
    useState<PrivacySettings | null>(null);
  const [completionStatus, setCompletionStatus] =
    useState<ProfileCompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all profile data
  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, businessRes, servicesRes, portfolioRes, privacyRes] =
        await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/business-profile'),
          fetch('/api/profile/me/services'),
          fetch('/api/profile/me/portfolio'),
          fetch('/api/profile/me/privacy'),
        ]);

      const [
        profileData,
        businessData,
        servicesData,
        portfolioData,
        privacyData,
      ] = await Promise.all([
        profileRes.json(),
        businessRes.json(),
        servicesRes.json(),
        portfolioRes.json(),
        privacyRes.json(),
      ]);

      if (profileRes.ok) setProfile(profileData.profile);
      if (businessRes.ok) setBusinessProfile(businessData.businessProfile);
      if (servicesRes.ok) setServices(servicesData.services);
      if (portfolioRes.ok) setPortfolio(portfolioData.portfolio);
      if (privacyRes.ok) setPrivacySettings(privacyData.privacy_settings);

      // Calculate completion status
      calculateCompletionStatus(
        profileData.profile,
        businessData.businessProfile,
        servicesData.services,
        portfolioData.portfolio
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load profile data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate profile completion status
  const calculateCompletionStatus = useCallback(
    (
      profileData: Profile | null,
      businessData: BusinessProfile | null,
      servicesData: Service[],
      portfolioData: PortfolioItem[]
    ) => {
      const personal_info = !!(
        profileData?.first_name && profileData?.last_name
      );
      const contact_info = !!(profileData?.phone && profileData?.address);
      const business_info = !!(
        businessData?.company_name && businessData?.description
      );
      const services = servicesData.length > 0;
      const portfolio = portfolioData.length >= 3;

      const completed = [
        personal_info,
        contact_info,
        business_info,
        services,
        portfolio,
      ].filter(Boolean).length;
      const overall_completion = Math.round((completed / 5) * 100);

      setCompletionStatus({
        personal_info,
        contact_info,
        business_info,
        services,
        portfolio,
        overall_completion,
      });
    },
    []
  );

  // Update profile
  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update profile');
        }

        setProfile(result.profile);
        await refreshUser();
        return result.profile;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshUser]
  );

  // Update business profile
  const updateBusinessProfile = useCallback(
    async (data: Partial<BusinessProfile>) => {
      try {
        const response = await fetch('/api/user/business-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update business profile');
        }

        setBusinessProfile(result.businessProfile);
        await refreshUser();
        return result.businessProfile;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update business profile';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshUser]
  );

  // Create service
  const createService = useCallback(
    async (
      data: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const response = await fetch('/api/profile/me/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create service');
        }

        await loadProfileData();
        return result.service;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create service';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Update service
  const updateService = useCallback(
    async (id: string, data: Partial<Service>) => {
      try {
        const response = await fetch(`/api/profile/me/services/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update service');
        }

        await loadProfileData();
        return result.service;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update service';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Delete service
  const deleteService = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/me/services/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete service');
        }

        await loadProfileData();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete service';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Create portfolio item
  const createPortfolioItem = useCallback(
    async (
      data: Omit<PortfolioItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const response = await fetch('/api/profile/me/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create portfolio item');
        }

        await loadProfileData();
        return result.portfolio_item;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to create portfolio item';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Update portfolio item
  const updatePortfolioItem = useCallback(
    async (id: string, data: Partial<PortfolioItem>) => {
      try {
        const response = await fetch(`/api/profile/me/portfolio/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update portfolio item');
        }

        await loadProfileData();
        return result.portfolio_item;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update portfolio item';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Delete portfolio item
  const deletePortfolioItem = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/profile/me/portfolio/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete portfolio item');
        }

        await loadProfileData();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete portfolio item';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadProfileData]
  );

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (data: PrivacySettings) => {
    try {
      const response = await fetch('/api/profile/me/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update privacy settings');
      }

      setPrivacySettings(result.privacy_settings);
      return result.privacy_settings;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update privacy settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    profile,
    businessProfile,
    services,
    portfolio,
    privacySettings,
    completionStatus,
    isLoading,
    error,
    loadProfileData,
    updateProfile,
    updateBusinessProfile,
    createService,
    updateService,
    deleteService,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    updatePrivacySettings,
  };
}
