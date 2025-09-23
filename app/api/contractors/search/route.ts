import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchAnalyticsService } from '@/lib/analytics/search-analytics';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Get user for analytics tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse search parameters
    const q = searchParams.get('q') || '';
    const serviceTypes =
      searchParams.get('service_types')?.split(',').filter(Boolean) || [];
    const location = searchParams.get('location') || '';
    const radius = searchParams.get('radius')
      ? parseInt(searchParams.get('radius')!)
      : null;
    const regions =
      searchParams.get('regions')?.split(',').filter(Boolean) || [];
    const priceMin = searchParams.get('price_min')
      ? parseFloat(searchParams.get('price_min')!)
      : null;
    const priceMax = searchParams.get('price_max')
      ? parseFloat(searchParams.get('price_max')!)
      : null;
    const ratingMin = searchParams.get('rating_min')
      ? parseFloat(searchParams.get('rating_min')!)
      : null;
    const responseTime = searchParams.get('response_time') || '';
    const hasPortfolio =
      searchParams.get('has_portfolio') === 'true'
        ? true
        : searchParams.get('has_portfolio') === 'false'
          ? false
          : null;
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    // Track search query for analytics
    if (
      user &&
      (q || serviceTypes.length > 0 || location || regions.length > 0)
    ) {
      const filters: Record<string, any> = {};
      if (serviceTypes.length > 0) filters.service_types = serviceTypes;
      if (location) filters.location = location;
      if (regions.length > 0) filters.regions = regions;
      if (priceMin !== null) filters.price_min = priceMin;
      if (priceMax !== null) filters.price_max = priceMax;
      if (ratingMin !== null) filters.rating_min = ratingMin;
      if (responseTime) filters.response_time = responseTime;
      if (hasPortfolio !== null) filters.has_portfolio = hasPortfolio;

      // Track the search query
      await searchAnalyticsService.trackSearchQuery({
        user_id: user.id,
        query: q,
        filters: filters,
        result_count: 0, // Will be updated after search
      });

      // Track individual filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
          await searchAnalyticsService.trackSearchFilter({
            user_id: user.id,
            filter_type: key,
            filter_value: Array.isArray(value)
              ? value.join(',')
              : String(value),
          });
        }
      }
    }

    // Use the advanced search function if we have complex filters
    if (
      q ||
      serviceTypes.length > 0 ||
      location ||
      regions.length > 0 ||
      priceMin !== null ||
      priceMax !== null ||
      ratingMin !== null
    ) {
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_contractors',
        {
          search_query: q,
          service_types: serviceTypes.length > 0 ? serviceTypes : null,
          location_filter: location,
          radius_km: radius,
          regions: regions.length > 0 ? regions : null,
          price_min: priceMin,
          price_max: priceMax,
          rating_min: ratingMin,
          response_time_filter: responseTime || null,
          has_portfolio: hasPortfolio,
          sort_by: sortBy,
          page_offset: offset,
          page_limit: limit,
        }
      );

      if (searchError) {
        console.error('Advanced search error:', searchError);
        return NextResponse.json(
          { error: 'Failed to search contractors' },
          { status: 500 }
        );
      }

      // Get full contractor details for the search results
      const contractorIds =
        searchResults?.map(result => result.contractor_id) || [];

      if (contractorIds.length === 0) {
        return NextResponse.json({
          contractors: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          searchQuery: {
            q,
            serviceTypes,
            location,
            radius,
            regions,
            priceMin,
            priceMax,
            ratingMin,
            responseTime,
            hasPortfolio,
            sortBy,
          },
        });
      }

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
        .in('id', contractorIds)
        .eq('role', 'contractor')
        .eq('is_verified', true);

      if (contractorsError) {
        console.error('Contractor details error:', contractorsError);
        return NextResponse.json(
          { error: 'Failed to fetch contractor details' },
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
            contractor.business_profiles.location ||
            contractor.profiles.location,
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

      // Record performance metrics
      const responseTime = Date.now() - startTime;
      await searchAnalyticsService.recordPerformanceMetric({
        metric_type: 'search',
        metric_name: 'response_time',
        metric_value: responseTime,
        metadata: {
          query: q,
          filters_count: Object.keys(filters).length,
          result_count: transformedContractors.length,
        },
      });

      return NextResponse.json({
        contractors: transformedContractors,
        total: searchResults?.length || 0,
        page,
        limit,
        totalPages: Math.ceil((searchResults?.length || 0) / limit),
        searchQuery: {
          q,
          serviceTypes,
          location,
          radius,
          regions,
          priceMin,
          priceMax,
          ratingMin,
          responseTime,
          hasPortfolio,
          sortBy,
        },
      });
    }

    // Fallback to basic search for simple queries
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

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query
          .order('business_profiles.average_rating', { ascending: false })
          .order('business_profiles.review_count', { ascending: false });
        break;
      case 'price_low':
        query = query.order('services.price_range_min', { ascending: true });
        break;
      case 'price_high':
        query = query.order('services.price_range_max', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
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

    // Record performance metrics for basic search
    const responseTime = Date.now() - startTime;
    await searchAnalyticsService.recordPerformanceMetric({
      metric_type: 'search',
      metric_name: 'response_time',
      metric_value: responseTime,
      metadata: {
        query: q,
        search_type: 'basic',
        result_count: transformedContractors.length,
      },
    });

    return NextResponse.json({
      contractors: transformedContractors,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      searchQuery: {
        q,
        serviceTypes,
        location,
        radius,
        regions,
        priceMin,
        priceMax,
        ratingMin,
        responseTime,
        hasPortfolio,
        sortBy,
      },
    });
  } catch (error) {
    console.error('Contractor search API error:', error);

    // Record error metrics
    const responseTime = Date.now() - startTime;
    await searchAnalyticsService.recordPerformanceMetric({
      metric_type: 'search',
      metric_name: 'error_count',
      metric_value: 1,
      metadata: {
        error_type: 'search_api_error',
        response_time: responseTime,
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
