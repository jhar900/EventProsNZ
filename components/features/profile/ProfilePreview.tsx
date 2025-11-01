'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Phone,
  MapPin,
  Building,
  Globe,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';

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
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
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

interface ProfilePreviewProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return <Eye className="h-4 w-4 text-green-600" />;
    case 'contacts_only':
      return <Users className="h-4 w-4 text-yellow-600" />;
    case 'private':
      return <EyeOff className="h-4 w-4 text-red-600" />;
    default:
      return <Eye className="h-4 w-4 text-gray-600" />;
  }
};

const getVisibilityLabel = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'contacts_only':
      return 'Contacts Only';
    case 'private':
      return 'Private';
    default:
      return 'Unknown';
  }
};

export function ProfilePreview({ onSuccess, onError }: ProfilePreviewProps) {
  const { user } = useAuth();
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
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Fetch profile data
        const profileResponse = await fetch('/api/profile/me');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.profile) {
            setProfile({
              id: profileData.profile.id || '',
              user_id: profileData.profile.user_id || user.id || '',
              first_name: profileData.profile.first_name || '',
              last_name: profileData.profile.last_name || '',
              phone: profileData.profile.phone || '',
              address: profileData.profile.address || '',
              bio: profileData.profile.bio || '',
              profile_photo_url:
                profileData.profile.avatar_url ||
                user.profile?.avatar_url ||
                '',
              created_at: profileData.profile.created_at || '',
              updated_at: profileData.profile.updated_at || '',
            });
          }
        }

        // Fetch business profile data
        const businessProfileResponse = await fetch(
          '/api/user/business-profile',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userData: user }),
          }
        );
        if (businessProfileResponse.ok) {
          const businessData = await businessProfileResponse.json();
          if (businessData.businessProfile) {
            setBusinessProfile(businessData.businessProfile);
          }
        }

        // Fetch services
        const servicesResponse = await fetch('/api/profile/me/services');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.services || []);
        }

        // Fetch portfolio
        const portfolioResponse = await fetch('/api/profile/me/portfolio');
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          setPortfolio(portfolioData.portfolio || []);
        }

        // Fetch privacy settings
        const privacyResponse = await fetch('/api/profile/me/privacy');
        if (privacyResponse.ok) {
          const privacyData = await privacyResponse.json();
          if (privacyData.privacy_settings) {
            setPrivacySettings(privacyData.privacy_settings);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        onError?.('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Price on request';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Price on request';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading profile preview...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">No profile data available.</div>
      </div>
    );
  }

  const visibleServices = services.filter(service => service.is_visible);
  const visiblePortfolio = portfolio.filter(item => item.is_visible);

  // Build social links from individual URL fields
  const socialLinks: Record<string, string> = {};
  if (businessProfile) {
    if (businessProfile.facebook_url)
      socialLinks.facebook = businessProfile.facebook_url;
    if (businessProfile.instagram_url)
      socialLinks.instagram = businessProfile.instagram_url;
    if (businessProfile.linkedin_url)
      socialLinks.linkedin = businessProfile.linkedin_url;
    if (businessProfile.twitter_url)
      socialLinks.twitter = businessProfile.twitter_url;
    if (businessProfile.youtube_url)
      socialLinks.youtube = businessProfile.youtube_url;
    if (businessProfile.tiktok_url)
      socialLinks.tiktok = businessProfile.tiktok_url;
    // Also check legacy social_links for backwards compatibility
    if (businessProfile.social_links) {
      Object.assign(socialLinks, businessProfile.social_links);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Preview</CardTitle>
          <p className="text-sm text-gray-600">
            This is how your profile will appear to other users based on your
            privacy settings.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profile_photo_url} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h2>
                {getVisibilityIcon(privacySettings.profile_visibility)}
                <Badge variant="outline">
                  {getVisibilityLabel(privacySettings.profile_visibility)}
                </Badge>
              </div>
              {profile.bio && (
                <p className="text-gray-600 mb-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
              {getVisibilityIcon(privacySettings.contact_visibility)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{profile.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          {businessProfile && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Information
                {getVisibilityIcon(privacySettings.business_visibility)}
                {businessProfile.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">
                    {businessProfile.company_name}
                  </span>
                </div>
                {businessProfile.description && (
                  <p className="text-gray-600">{businessProfile.description}</p>
                )}
                {businessProfile.business_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{businessProfile.business_address}</span>
                  </div>
                )}
                {businessProfile.service_areas &&
                  businessProfile.service_areas.length > 0 && (
                    <div>
                      <span className="font-medium">Service Areas: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {businessProfile.service_areas.map(area => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="text-xs"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {Object.keys(socialLinks).length > 0 && (
                  <div>
                    <span className="font-medium">Social Links: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 text-xs"
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          {visibleServices.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleServices.map(service => (
                  <div key={service.id} className="border rounded-lg p-3">
                    <div className="font-medium text-sm">
                      {service.service_type}
                    </div>
                    {service.description && (
                      <p className="text-gray-600 text-xs mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {formatPriceRange(
                        service.price_range_min,
                        service.price_range_max
                      )}
                    </div>
                    {service.availability && (
                      <div className="text-xs text-gray-500 mt-1">
                        Available: {service.availability}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {visiblePortfolio.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Portfolio
                {getVisibilityIcon(privacySettings.portfolio_visibility)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visiblePortfolio.map(item => (
                  <div key={item.id} className="border rounded-lg p-3">
                    {item.image_url && (
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-2">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="font-medium text-sm">{item.title}</div>
                    {item.description && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.event_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.event_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Privacy Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Profile Information:</span>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon(privacySettings.profile_visibility)}
                  <span>
                    {getVisibilityLabel(privacySettings.profile_visibility)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Contact Information:</span>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon(privacySettings.contact_visibility)}
                  <span>
                    {getVisibilityLabel(privacySettings.contact_visibility)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Portfolio:</span>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon(privacySettings.portfolio_visibility)}
                  <span>
                    {getVisibilityLabel(privacySettings.portfolio_visibility)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Business Information:</span>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon(privacySettings.business_visibility)}
                  <span>
                    {getVisibilityLabel(privacySettings.business_visibility)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
