import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const q = searchParams.get('q') || '';
    const serviceType = searchParams.get('service_type') || '';
    const location = searchParams.get('location') || '';
    const priceMin = searchParams.get('price_min')
      ? parseFloat(searchParams.get('price_min')!)
      : null;
    const priceMax = searchParams.get('price_max')
      ? parseFloat(searchParams.get('price_max')!)
      : null;
    const ratingMin = searchParams.get('rating_min')
      ? parseFloat(searchParams.get('rating_min')!)
      : null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);

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

    // Apply text search
    if (q) {
      query = query.or(`
        business_profiles.company_name.ilike.%${q}%,
        business_profiles.description.ilike.%${q}%,
        profiles.first_name.ilike.%${q}%,
        profiles.last_name.ilike.%${q}%,
        business_profiles.service_categories.cs.{${q}}
      `);
    }

    // Apply service type filter
    if (serviceType) {
      query = query.contains('business_profiles.service_categories', [
        serviceType,
      ]);
    }

    // Apply location filter
    if (location) {
      query = query.or(`
        business_profiles.location.ilike.%${location}%,
        business_profiles.service_areas.cs.{${location}},
        profiles.location.ilike.%${location}%
      `);
    }

    // Apply rating filter
    if (ratingMin) {
      query = query.gte('business_profiles.average_rating', ratingMin);
    }

    // Apply price range filter
    if (priceMin !== null || priceMax !== null) {
      if (priceMin !== null && priceMax !== null) {
        query = query.or(`
          services.price_range_min.gte.${priceMin},services.price_range_max.lte.${priceMax},
          services.price_range_min.lte.${priceMin},services.price_range_max.gte.${priceMax}
        `);
      } else if (priceMin !== null) {
        query = query.gte('services.price_range_min', priceMin);
      } else if (priceMax !== null) {
        query = query.lte('services.price_range_max', priceMax);
      }
    }

    // Sort by premium first, then rating
    query = query
      .order('business_profiles.subscription_tier', { ascending: false })
      .order('business_profiles.average_rating', { ascending: false })
      .order('business_profiles.review_count', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contractors, error: contractorsError, count } = await query;

    if (contractorsError) {
      console.error('Contractor search error:', contractorsError);
      return NextResponse.json(
        { error: 'Failed to search contractors' },
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

    return NextResponse.json({
      contractors: transformedContractors,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      searchQuery: {
        q,
        serviceType,
        location,
        priceMin,
        priceMax,
        ratingMin,
      },
    });
  } catch (error) {
    console.error('Contractor search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
