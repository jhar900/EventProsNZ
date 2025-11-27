import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

    const supabase = createClient();

    // Get contractor with profile data
    const { data: contractorData, error: contractorError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        created_at,
        status,
        profiles!inner(
          first_name,
          last_name,
          avatar_url,
          location,
          bio
        ),
        business_profiles(
          id,
          company_name,
          description,
          location,
          business_address,
          service_categories,
          service_areas,
          nzbn,
          average_rating,
          review_count,
          is_verified,
          subscription_tier,
          logo_url,
          website,
          facebook_url,
          instagram_url,
          linkedin_url,
          twitter_url,
          youtube_url,
          tiktok_url,
          is_published
        )
      `
      )
      .eq('id', contractorId)
      .single();

    if (contractorError || !contractorData) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get current user to check permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is admin
    let isAdmin = false;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = userData?.role === 'admin';
    }

    const isOwner = user?.id === contractorId;

    // Check if contractor is suspended - block public access
    if (contractorData.status === 'suspended') {
      if (!isOwner && !isAdmin) {
        // Not viewing own profile and not admin, return 404
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 404 }
        );
      }
      // If viewing own profile or admin, continue but mark as suspended
    }

    // Check if business profile is published
    const businessProfile = Array.isArray(contractorData.business_profiles)
      ? contractorData.business_profiles[0]
      : contractorData.business_profiles;

    if (businessProfile && businessProfile.is_published === false) {
      // Profile is not published - only allow owner and admin to view
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 404 }
        );
      }
    }

    // Transform the data to match the expected format
    const profile = Array.isArray(contractorData.profiles)
      ? contractorData.profiles[0]
      : contractorData.profiles;

    // businessProfile was already extracted above for the is_published check

    // Fetch services for this contractor
    let services: any[] = [];
    if (businessProfile?.id) {
      const { data: servicesData } = await supabase
        .from('services')
        .select(
          `
          id,
          name,
          service_name,
          category,
          description,
          price_range_min,
          price_range_max,
          availability,
          created_at,
          updated_at
        `
        )
        .eq('business_profile_id', businessProfile.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (servicesData) {
        services = servicesData.map((s: any) => ({
          id: s.id,
          serviceType: s.service_name || s.name || s.category || '',
          description: s.description || null,
          priceRangeMin: s.price_range_min || null,
          priceRangeMax: s.price_range_max || null,
          availability: s.availability || null,
          createdAt: s.created_at || new Date().toISOString(),
          updatedAt: s.updated_at || null,
        }));
      }
    }

    const contractor = {
      id: contractorData.id,
      email: contractorData.email,
      name: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : 'Unknown User',
      companyName: businessProfile?.company_name || 'No Company Name',
      description: businessProfile?.description || '',
      location: businessProfile?.location || profile?.location || null,
      avatarUrl: profile?.avatar_url || null,
      logoUrl: businessProfile?.logo_url || null,
      bio: profile?.bio || null,
      serviceCategories: businessProfile?.service_categories || [],
      averageRating: businessProfile?.average_rating || 0,
      reviewCount: businessProfile?.review_count || 0,
      isVerified: businessProfile?.is_verified || false,
      subscriptionTier: businessProfile?.subscription_tier || 'essential',
      businessAddress:
        businessProfile?.business_address || businessProfile?.location || null,
      nzbn: businessProfile?.nzbn || null,
      serviceAreas: businessProfile?.service_areas || [],
      website: businessProfile?.website || null,
      socialLinks: null,
      facebookUrl: businessProfile?.facebook_url || null,
      instagramUrl: businessProfile?.instagram_url || null,
      linkedinUrl: businessProfile?.linkedin_url || null,
      twitterUrl: businessProfile?.twitter_url || null,
      youtubeUrl: businessProfile?.youtube_url || null,
      tiktokUrl: businessProfile?.tiktok_url || null,
      verificationDate: null,
      services: services,
      portfolio: [],
      testimonials: [],
      createdAt: contractorData.created_at,
      isPremium: businessProfile?.subscription_tier !== 'essential',
      isFeatured: false,
    };

    return NextResponse.json({ contractor });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}
