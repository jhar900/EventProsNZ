import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchAnalyticsService } from '@/lib/analytics/search-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const { searchParams } = url;

  try {
    const supabase = createClient();

    // Get user for analytics tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse search parameters
    const q = searchParams.get('q') || '';
    const serviceTypesParam = searchParams.get('service_types');
    const serviceTypes = serviceTypesParam
      ? serviceTypesParam.split(',').filter(Boolean)
      : [];

    // Debug: Log what we received
    console.log(`[Search] Received params:`, {
      q,
      serviceTypes,
      serviceTypesParam,
      allParams: Object.fromEntries(searchParams.entries()),
    });
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
    // Rating and premium filters removed per user request
    const ratingMin = null;
    const premiumOnly = false;
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

    // Build query with filters directly (instead of using RPC function)
    // Use left joins instead of inner joins to handle contractors without business profiles
    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        created_at,
        status,
        profiles(
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
          service_areas,
          average_rating,
          review_count,
          is_verified,
          subscription_tier,
          logo_url,
          is_published
        )
      `,
        { count: 'exact' }
      )
      .eq('role', 'contractor')
      .neq('status', 'suspended');

    // Note: All filters are applied after fetching due to Supabase limitations
    // with nested queries and array operations on joined tables
    // We fetch more results than requested to account for post-fetch filtering

    // Apply sorting - only sort by top-level fields here
    // Nested table sorting will be done in memory after fetching
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        // Default: sort by created_at, then we'll sort in memory
        query = query.order('created_at', { ascending: false });
    }

    // Fetch more results than needed to account for post-fetch filtering
    // Then we'll apply pagination after filtering
    const fetchLimit = Math.max(limit * 10, 100); // Fetch 10x the needed amount or at least 100 to account for filtering
    query = query.range(0, fetchLimit - 1);

    const { data: contractors, error: contractorsError, count } = await query;

    // If query fails, return empty results instead of error
    if (contractorsError) {
      console.error('Contractor search error:', contractorsError);
      // Return empty results instead of error
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
          // Price, rating, and premium filters removed per user request
          responseTime,
          hasPortfolio,
          sortBy,
        },
      });
    }

    // Debug: Log how many contractors we got
    console.log(
      `[Search] Fetched ${contractors?.length || 0} contractors before filtering`
    );

    // Filter out contractors without required data and normalize data structure
    // Supabase returns relationships as arrays, so we need to extract the first item
    let filteredContractors = (contractors || [])
      .map(contractor => {
        // Extract profile (Supabase returns as array)
        const profile = Array.isArray(contractor.profiles)
          ? contractor.profiles[0]
          : contractor.profiles;

        // Extract business profile (Supabase returns as array)
        const businessProfile = Array.isArray(contractor.business_profiles)
          ? contractor.business_profiles[0]
          : contractor.business_profiles;

        // Must have both profile and business profile
        if (!profile || !businessProfile) return null;

        // Must be published (is_published = true)
        if (businessProfile.is_published !== true) return null;

        return {
          ...contractor,
          profiles: profile,
          business_profiles: businessProfile,
        };
      })
      .filter(
        (contractor): contractor is NonNullable<typeof contractor> =>
          contractor !== null
      );

    // Debug: Log how many contractors we have after normalizing
    console.log(
      `[Search] After normalization: ${filteredContractors.length} contractors`
    );

    // Rating and premium filters removed per user request

    // Service type filter - FOCUS: This is what we're debugging
    if (serviceTypes.length > 0) {
      console.log(`[Search] Applying service type filter:`, serviceTypes);
      const beforeCount = filteredContractors.length;

      // Debug: Log first few contractors' categories
      console.log(
        `[Search] Sample contractor categories:`,
        filteredContractors.slice(0, 3).map(c => ({
          name: c.business_profiles?.company_name,
          categories: c.business_profiles?.service_categories || [],
        }))
      );

      filteredContractors = filteredContractors.filter(contractor => {
        const categories =
          contractor.business_profiles?.service_categories || [];
        // Normalize both arrays to lowercase for comparison
        const normalizedCategories = categories.map(c => c.toLowerCase());
        const normalizedServiceTypes = serviceTypes.map(s => s.toLowerCase());
        const matches = normalizedServiceTypes.some(type =>
          normalizedCategories.includes(type)
        );

        if (!matches && categories.length > 0) {
          console.log(
            `[Search] NO MATCH: ${contractor.business_profiles?.company_name} - categories: [${categories.join(', ')}] vs filter: [${serviceTypes.join(', ')}]`
          );
        }
        return matches;
      });
      console.log(
        `[Search] Service type filter result: ${beforeCount} -> ${filteredContractors.length} contractors`
      );
    } else {
      console.log(`[Search] No service type filter applied`);
    }

    // Location filter - includes contractors with "Nationwide" in service_areas
    if (location) {
      const locationLower = location.toLowerCase();
      filteredContractors = filteredContractors.filter(contractor => {
        // Check if contractor has "Nationwide" in service_areas
        const serviceAreas = contractor.business_profiles?.service_areas || [];
        const hasNationwide =
          Array.isArray(serviceAreas) &&
          serviceAreas.some(
            area => area?.toString().toLowerCase() === 'nationwide'
          );

        // If they have "Nationwide", include them regardless of location filter
        if (hasNationwide) {
          return true;
        }

        // Otherwise, check if location matches business or profile location
        const businessLocation =
          contractor.business_profiles?.location?.toLowerCase() || '';
        const profileLocation =
          contractor.profiles?.location?.toLowerCase() || '';

        return (
          businessLocation.includes(locationLower) ||
          profileLocation.includes(locationLower)
        );
      });
    }

    // Price filters removed per user request

    // Apply text search filter if specified (applied after fetching)
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredContractors = filteredContractors.filter(contractor => {
        const companyName =
          contractor.business_profiles?.company_name?.toLowerCase() || '';
        const description =
          contractor.business_profiles?.description?.toLowerCase() || '';
        const location =
          (
            contractor.business_profiles?.location ||
            contractor.profiles?.location ||
            ''
          )?.toLowerCase() || '';
        const firstName = contractor.profiles?.first_name?.toLowerCase() || '';
        const lastName = contractor.profiles?.last_name?.toLowerCase() || '';
        const serviceCategories =
          contractor.business_profiles?.service_categories
            ?.join(' ')
            ?.toLowerCase() || '';

        return (
          companyName.includes(searchTerm) ||
          description.includes(searchTerm) ||
          location.includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          serviceCategories.includes(searchTerm)
        );
      });
    }

    // Apply sorting in memory (since we can't sort by nested fields in Supabase query)
    switch (sortBy) {
      case 'rating':
        filteredContractors.sort((a, b) => {
          const ratingA = a.business_profiles?.average_rating || 0;
          const ratingB = b.business_profiles?.average_rating || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          const reviewsA = a.business_profiles?.review_count || 0;
          const reviewsB = b.business_profiles?.review_count || 0;
          return reviewsB - reviewsA;
        });
        break;
      case 'newest':
        filteredContractors.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filteredContractors.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB;
        });
        break;
      default:
        // Default: premium first, then by rating
        filteredContractors.sort((a, b) => {
          const tierA = a.business_profiles?.subscription_tier || 'essential';
          const tierB = b.business_profiles?.subscription_tier || 'essential';
          const premiumTiers = ['professional', 'enterprise'];
          const aIsPremium = premiumTiers.includes(tierA);
          const bIsPremium = premiumTiers.includes(tierB);
          if (aIsPremium !== bIsPremium) {
            return aIsPremium ? -1 : 1;
          }
          const ratingA = a.business_profiles?.average_rating || 0;
          const ratingB = b.business_profiles?.average_rating || 0;
          return ratingB - ratingA;
        });
    }

    // Transform the data to match the expected format
    const transformedContractors = filteredContractors.map(contractor => ({
      id: contractor.id,
      email: contractor.email,
      name: `${contractor.profiles.first_name} ${contractor.profiles.last_name}`,
      companyName: contractor.business_profiles.company_name,
      description: contractor.business_profiles.description || '',
      location:
        contractor.business_profiles.location ||
        contractor.profiles.location ||
        '',
      avatarUrl: contractor.profiles.avatar_url,
      logoUrl: contractor.business_profiles.logo_url,
      bio: contractor.profiles.bio,
      serviceCategories: contractor.business_profiles.service_categories || [],
      averageRating: contractor.business_profiles.average_rating || 0,
      reviewCount: contractor.business_profiles.review_count || 0,
      isVerified: contractor.business_profiles.is_verified,
      subscriptionTier: contractor.business_profiles.subscription_tier,
      businessAddress: contractor.business_profiles.location || '',
      serviceAreas: contractor.business_profiles.service_areas || [],
      socialLinks: null,
      verificationDate: null,
      services: [], // Services will be fetched separately if needed
      createdAt: contractor.created_at,
      isPremium: ['professional', 'enterprise'].includes(
        contractor.business_profiles.subscription_tier
      ),
    }));

    // Record performance metrics
    const searchResponseTime = Date.now() - startTime;
    const filters: Record<string, any> = {};
    if (serviceTypes.length > 0) filters.service_types = serviceTypes;
    if (location) filters.location = location;
    if (regions.length > 0) filters.regions = regions;
    // Price, rating, and premium filters removed per user request
    if (responseTime) filters.response_time = responseTime;
    if (hasPortfolio !== null) filters.has_portfolio = hasPortfolio;

    await searchAnalyticsService.recordPerformanceMetric({
      metric_type: 'search',
      metric_name: 'response_time',
      metric_value: searchResponseTime,
      metadata: {
        query: q,
        filters_count: Object.keys(filters).length,
        result_count: transformedContractors.length,
      },
    });

    // Apply pagination after filtering
    const total = transformedContractors.length;
    const paginatedContractors = transformedContractors.slice(
      offset,
      offset + limit
    );

    // Debug: Log final results
    console.log(
      `[Search] Final: ${total} total, ${paginatedContractors.length} returned for page ${page}`
    );

    return NextResponse.json({
      contractors: paginatedContractors,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchQuery: {
        q,
        serviceTypes,
        location,
        radius,
        regions,
        // Price, rating, and premium filters removed per user request
        responseTime,
        hasPortfolio,
        sortBy,
      },
    });
  } catch (error) {
    // Record error metrics
    const responseTime = Date.now() - startTime;

    // Log error for debugging but don't expose to user
    console.error('Search API error:', error);

    try {
      await searchAnalyticsService.recordPerformanceMetric({
        metric_type: 'search',
        metric_name: 'error_count',
        metric_value: 1,
        metadata: {
          error_type: 'search_api_error',
          response_time: responseTime,
        },
      });
    } catch (analyticsError) {
      // Don't fail if analytics fails
      console.error('Analytics error:', analyticsError);
    }

    // Return empty results instead of error to provide better UX
    // Users can see "no results" instead of error page
    const q = searchParams.get('q') || '';
    const serviceTypes =
      searchParams.get('service_types')?.split(',').filter(Boolean) || [];
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);

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
        sortBy,
      },
    });
  }
}
