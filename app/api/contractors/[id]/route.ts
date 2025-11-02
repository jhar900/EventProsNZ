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
        profiles!inner(
          first_name,
          last_name,
          avatar_url,
          location,
          bio
        ),
        business_profiles(
          company_name,
          description,
          location,
          service_categories,
          average_rating,
          review_count,
          is_verified,
          subscription_tier,
          logo_url,
          facebook_url,
          instagram_url,
          linkedin_url,
          twitter_url,
          youtube_url,
          tiktok_url
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

    // Transform the data to match the expected format
    const profile = Array.isArray(contractorData.profiles)
      ? contractorData.profiles[0]
      : contractorData.profiles;

    const businessProfile = Array.isArray(contractorData.business_profiles)
      ? contractorData.business_profiles[0]
      : contractorData.business_profiles;

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
      businessAddress: null,
      serviceAreas: [],
      socialLinks: null,
      facebookUrl: businessProfile?.facebook_url || null,
      instagramUrl: businessProfile?.instagram_url || null,
      linkedinUrl: businessProfile?.linkedin_url || null,
      twitterUrl: businessProfile?.twitter_url || null,
      youtubeUrl: businessProfile?.youtube_url || null,
      tiktokUrl: businessProfile?.tiktok_url || null,
      verificationDate: null,
      services: [],
      portfolio: [],
      testimonials: [],
      createdAt: contractorData.created_at,
      isPremium: false,
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
