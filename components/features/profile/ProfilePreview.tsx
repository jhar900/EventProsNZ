'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Contractor, Service } from '@/types/contractors';
import { ContractorProfileDisplay } from '@/components/features/contractors/ContractorProfileDisplay';

interface ProfilePreviewProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function ProfilePreview({
  userId: propUserId,
  onSuccess,
  onError,
}: ProfilePreviewProps) {
  const { user } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // If viewing another user (admin), use admin API endpoint
        const businessProfileEndpoint = propUserId
          ? `/api/admin/users/${propUserId}/business-profile`
          : '/api/user/business-profile';

        // Fetch business profile
        const businessProfileResponse = await fetch(businessProfileEndpoint, {
          method: 'GET',
          headers: {
            'x-user-id': targetUserId,
          },
          credentials: 'include',
        });

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

        // If viewing another user (admin), use admin API endpoint
        const servicesEndpoint = propUserId
          ? `/api/admin/users/${propUserId}/services`
          : '/api/profile/me/services';

        // Fetch services
        const servicesResponse = await fetch(servicesEndpoint, {
          headers: {
            'x-user-id': targetUserId,
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

        // If viewing another user (admin), use admin API endpoint
        const portfolioEndpoint = propUserId
          ? `/api/admin/users/${propUserId}/portfolio`
          : '/api/profile/me/portfolio';

        // Fetch portfolio items
        const portfolioResponse = await fetch(portfolioEndpoint, {
          headers: {
            'x-user-id': targetUserId,
          },
          credentials: 'include',
        });

        let portfolio: any[] = [];
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          // Transform portfolio items to match PortfolioItem type
          portfolio = (portfolioData.portfolio || [])
            .filter((p: any) => p.is_visible !== false) // Only show visible items
            .map((p: any) => ({
              id: p.id,
              title: p.title || 'Untitled',
              description: p.description || null,
              imageUrl: p.image_url || null,
              videoUrl: p.video_url || null,
              eventDate: p.event_date || null,
              createdAt: p.created_at || new Date().toISOString(),
            }));
        }

        // If viewing another user (admin), use admin API endpoint
        const profileEndpoint = propUserId
          ? `/api/admin/users/${propUserId}/profile`
          : '/api/user/profile';

        // Fetch user profile for name and avatar
        const profileResponse = await fetch(profileEndpoint, {
          method: 'GET',
          headers: {
            'x-user-id': targetUserId,
          },
          credentials: 'include',
        });

        let profile: any = null;
        let userEmail: string = '';
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          profile = profileData.profile;

          // If viewing another user (admin), also fetch user email
          if (propUserId) {
            try {
              const userResponse = await fetch(
                `/api/admin/users/${propUserId}`,
                {
                  credentials: 'include',
                }
              );
              if (userResponse.ok) {
                const userData = await userResponse.json();
                userEmail = userData.user?.email || '';
              }
            } catch (error) {
              console.error('Error fetching user email:', error);
            }
          } else {
            userEmail = user?.email || '';
          }
        }

        // Transform to Contractor type
        const contractorData: Contractor = {
          id: targetUserId,
          email: userEmail,
          name: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
              userEmail?.split('@')[0] ||
              'User'
            : userEmail?.split('@')[0] || 'User',
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
          portfolio: portfolio,
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
  }, [targetUserId, propUserId]);

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
