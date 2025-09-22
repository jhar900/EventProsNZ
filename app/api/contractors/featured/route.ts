import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    // Get featured contractors (premium tier with high ratings)
    const { data: contractors, error: contractorsError } = await supabase
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
        business_profiles!inner(
          company_name,
          description,
          location,
          service_categories,
          average_rating,
          review_count,
          is_verified,
          subscription_tier,
          business_address,
          service_areas,
          social_links,
          verification_date
        ),
        services(
          service_type,
          description,
          price_range_min,
          price_range_max,
          availability
        )
      `
      )
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .in('business_profiles.subscription_tier', ['professional', 'enterprise'])
      .gte('business_profiles.average_rating', 4.0)
      .gte('business_profiles.review_count', 5)
      .order('business_profiles.subscription_tier', { ascending: false })
      .order('business_profiles.average_rating', { ascending: false })
      .order('business_profiles.review_count', { ascending: false })
      .limit(limit);

    if (contractorsError) {
      console.error('Featured contractors fetch error:', contractorsError);
      return NextResponse.json(
        { error: 'Failed to fetch featured contractors' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedContractors =
      contractors?.map(contractor => ({
        id: contractor.id,
        email: contractor.email,
        name: `${contractor.profiles.first_name} ${contractor.profiles.last_name}`,
        companyName: contractor.business_profiles.company_name,
        description: contractor.business_profiles.description,
        location:
          contractor.business_profiles.location || contractor.profiles.location,
        avatarUrl: contractor.profiles.avatar_url,
        bio: contractor.profiles.bio,
        serviceCategories:
          contractor.business_profiles.service_categories || [],
        averageRating: contractor.business_profiles.average_rating || 0,
        reviewCount: contractor.business_profiles.review_count || 0,
        isVerified: contractor.business_profiles.is_verified,
        subscriptionTier: contractor.business_profiles.subscription_tier,
        businessAddress: contractor.business_profiles.business_address,
        serviceAreas: contractor.business_profiles.service_areas || [],
        socialLinks: contractor.business_profiles.social_links,
        verificationDate: contractor.business_profiles.verification_date,
        services: contractor.services || [],
        createdAt: contractor.created_at,
        isPremium: true,
        isFeatured: true,
      })) || [];

    return NextResponse.json({
      contractors: transformedContractors,
      total: contractors?.length || 0,
    });
  } catch (error) {
    console.error('Featured contractors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
