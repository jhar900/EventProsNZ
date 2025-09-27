import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const sort = searchParams.get('sort') || 'premium_first';
    const view = searchParams.get('view') || 'grid';
    const premiumOnly = searchParams.get('premium_only') === 'true';

    const offset = (page - 1) * limit;

    // Build the base query for approved contractors only
    let query = supabase
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
      .eq('is_verified', true);

    // Apply premium filter if requested
    if (premiumOnly) {
      query = query.in('business_profiles.subscription_tier', [
        'professional',
        'enterprise',
      ]);
    }

    // Apply sorting
    switch (sort) {
      case 'premium_first':
        query = query
          .order('business_profiles.subscription_tier', { ascending: false })
          .order('business_profiles.average_rating', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'rating':
        query = query
          .order('business_profiles.average_rating', { ascending: false })
          .order('business_profiles.review_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name':
        query = query.order('business_profiles.company_name', {
          ascending: true,
        });
        break;
      default:
        query = query
          .order('business_profiles.subscription_tier', { ascending: false })
          .order('business_profiles.average_rating', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contractors, error: contractorsError, count } = await query;

    if (contractorsError) {
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
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
        isPremium: ['professional', 'enterprise'].includes(
          contractor.business_profiles.subscription_tier
        ),
      })) || [];

    // If no contractors found, return empty array instead of error
    if (transformedContractors.length === 0) {
      }

    return NextResponse.json({
      contractors: transformedContractors,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
