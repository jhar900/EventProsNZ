'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Contractor, Service } from '@/types/contractors';
import { ContractorProfileDisplay } from '@/components/features/contractors/ContractorProfileDisplay';

interface ProfilePreviewProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function ProfilePreview({ onSuccess, onError }: ProfilePreviewProps) {
  const { user } = useAuth();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch business profile
        const businessProfileResponse = await fetch(
          '/api/user/business-profile',
          {
            method: 'GET',
            headers: {
              'x-user-id': user.id,
            },
            credentials: 'include',
          }
        );

        if (!businessProfileResponse.ok) {
          throw new Error('Failed to load business profile');
        }

        const businessData = await businessProfileResponse.json();
        const businessProfile =
          businessData.businessProfile || businessData.business_profile;

        if (!businessProfile) {
          setIsLoading(false);
          return;
        }

        // Debug: Log website field
        console.log('Business profile website:', businessProfile.website);

        // Fetch services
        const servicesResponse = await fetch('/api/profile/me/services', {
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        let services: Service[] = [];
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          // Transform services to match Contractor Service type
          // The Service type expects serviceType, which should be the service name
          services = (servicesData.services || [])
            .filter((s: any) => s.is_visible)
            .map((s: any) => ({
              id: s.id,
              serviceType: s.service_name || s.service_type || '', // Use service_name as serviceType for display
              description: s.description || null,
              priceRangeMin: s.price_range_min || null,
              priceRangeMax: s.price_range_max || null,
              availability: s.availability || null,
              createdAt: s.created_at || new Date().toISOString(),
              updatedAt: s.updated_at || null,
            }));
        }

        // Fetch user profile for name and avatar
        const profileResponse = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        let profile: any = null;
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          profile = profileData.profile;
        }

        // Transform to Contractor type
        const contractorData: Contractor = {
          id: user.id,
          email: user.email || '',
          name: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
              user.email?.split('@')[0] ||
              'User'
            : user.email?.split('@')[0] || 'User',
          companyName: businessProfile.company_name || 'No Company Name',
          description: businessProfile.description || null,
          location:
            businessProfile.business_address ||
            businessProfile.location ||
            null,
          avatarUrl: profile?.avatar_url || null,
          logoUrl: businessProfile.logo_url || null,
          bio: profile?.bio || null,
          phone: profile?.phone || null,
          address: profile?.address || null,
          serviceCategories: businessProfile.service_categories || [],
          averageRating: businessProfile.average_rating || 0,
          reviewCount: businessProfile.review_count || 0,
          isVerified: businessProfile.is_verified || false,
          subscriptionTier: businessProfile.subscription_tier || 'essential',
          businessAddress:
            businessProfile.business_address ||
            businessProfile.location ||
            null,
          nzbn: businessProfile.nzbn || null,
          serviceAreas: businessProfile.service_areas || [],
          website:
            businessProfile.website && businessProfile.website.trim() !== ''
              ? businessProfile.website
              : null,
          socialLinks: businessProfile.social_links || null,
          facebookUrl: businessProfile.facebook_url || null,
          instagramUrl: businessProfile.instagram_url || null,
          linkedinUrl: businessProfile.linkedin_url || null,
          twitterUrl: businessProfile.twitter_url || null,
          youtubeUrl: businessProfile.youtube_url || null,
          tiktokUrl: businessProfile.tiktok_url || null,
          verificationDate: businessProfile.verification_date || null,
          services: services,
          portfolio: [], // Portfolio can be fetched separately if needed
          testimonials: [], // Testimonials can be fetched separately if needed
          createdAt: businessProfile.created_at || new Date().toISOString(),
          updatedAt: businessProfile.updated_at || null,
          isPremium: businessProfile.subscription_tier !== 'essential',
          isFeatured: false,
        };

        // Debug: Log contractor website
        console.log('Contractor data website:', contractorData.website);
        setContractor(contractorData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        onError?.('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading profile preview...</div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">
          No business profile found. Please complete your business profile
          first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Business Profile Preview
        </h2>
        <p className="text-gray-600">
          This is how your business profile appears to visitors on Event Pros NZ
        </p>
      </div>
      <ContractorProfileDisplay contractor={contractor} isPreview={true} />
    </div>
  );
}
