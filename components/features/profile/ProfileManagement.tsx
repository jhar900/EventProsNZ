'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoEditor } from './PersonalInfoEditor';
import { BusinessInfoEditor } from './BusinessInfoEditor';
import { ServicesEditor } from './ServicesEditor';
import { PortfolioManager } from './PortfolioManager';
import { PrivacySettings } from './PrivacySettings';
import { ProfilePreview } from './ProfilePreview';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  bio?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_address?: string;
  nzbn?: string;
  description?: string;
  service_areas?: string[];
  social_links?: Record<string, string>;
  is_verified: boolean;
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
  is_visible: boolean;
  created_at: string;
}

interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  video_platform?: 'youtube' | 'vimeo';
  event_date?: string;
  is_visible: boolean;
  created_at: string;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'contacts_only' | 'private';
  contact_visibility: 'public' | 'contacts_only' | 'private';
  portfolio_visibility: 'public' | 'contacts_only' | 'private';
  business_visibility: 'public' | 'contacts_only' | 'private';
}

export function ProfileManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    contact_visibility: 'public',
    portfolio_visibility: 'public',
    business_visibility: 'public',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);

      // Fetch profile data
      const profileResponse = await fetch('/api/profile/me', {
        credentials: 'include',
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.profile);
        setBusinessProfile(profileData.business_profile);
      }

      // Fetch services
      const servicesResponse = await fetch('/api/profile/me/services', {
        credentials: 'include',
      });
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      }

      // Fetch portfolio
      const portfolioResponse = await fetch('/api/profile/me/portfolio', {
        credentials: 'include',
      });
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolio(portfolioData.portfolio);
      }

      // Fetch privacy settings
      const privacyResponse = await fetch('/api/profile/me/privacy', {
        credentials: 'include',
      });
      if (privacyResponse.ok) {
        const privacyData = await privacyResponse.json();
        setPrivacySettings(privacyData.privacy_settings);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const handleBusinessProfileUpdate = (
    updatedBusinessProfile: BusinessProfile
  ) => {
    setBusinessProfile(updatedBusinessProfile);
  };

  const handleServicesUpdate = (updatedServices: Service[]) => {
    setServices(updatedServices);
  };

  const handlePortfolioUpdate = (updatedPortfolio: PortfolioItem[]) => {
    setPortfolio(updatedPortfolio);
  };

  const handlePrivacySettingsUpdate = (updatedSettings: PrivacySettings) => {
    setPrivacySettings(updatedSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Management
        </h1>
        <p className="text-gray-600">
          Manage your personal information, business details, and privacy
          settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalInfoEditor
            profile={profile}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <BusinessInfoEditor
            businessProfile={businessProfile}
            onUpdate={handleBusinessProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <ServicesEditor services={services} onUpdate={handleServicesUpdate} />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <PortfolioManager
            portfolio={portfolio}
            onUpdate={handlePortfolioUpdate}
          />
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <PrivacySettings
            settings={privacySettings}
            onUpdate={handlePrivacySettingsUpdate}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <ProfilePreview
            profile={profile}
            businessProfile={businessProfile}
            services={services}
            portfolio={portfolio}
            privacySettings={privacySettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
