import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    // Query business_profiles first (more efficient than starting from users)
    // This allows us to filter directly on business_profiles fields
    const { data: businessProfiles, error: businessProfilesError } =
      await supabase
        .from('business_profiles')
        .select(
          'user_id, company_name, description, location, service_categories, average_rating, review_count, is_verified, subscription_tier, business_address, service_areas, social_links, verification_date, logo_url'
        )
        .eq('is_published', true)
        .eq('is_verified', true)
        .in('subscription_tier', ['showcase', 'spotlight'])
        .gte('average_rating', 4.0)
        .gte('review_count', 5)
        .order('subscription_tier', { ascending: false })
        .order('average_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(limit);

    if (businessProfilesError) {
      console.error(
        'Error fetching featured contractors:',
        businessProfilesError
      );
      return NextResponse.json(
        {
          error: 'Failed to fetch featured contractors',
          details: businessProfilesError.message,
        },
        { status: 500 }
      );
    }

    if (!businessProfiles || businessProfiles.length === 0) {
      return NextResponse.json(
        {
          contractors: [],
          total: 0,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
          },
        }
      );
    }

    // Get user IDs for fetching related data in parallel
    const userIds = businessProfiles.map(bp => bp.user_id);

    // Fetch users, profiles, and services in parallel
    const [usersResult, profilesResult, servicesResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, created_at, role')
        .in('id', userIds)
        .eq('role', 'contractor'),
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, location, bio')
        .in('user_id', userIds),
      // Skip services fetch for featured contractors - not needed for listing
      Promise.resolve({ data: [], error: null }),
    ]);

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error);
    }
    if (profilesResult.error) {
      console.error('Error fetching profiles:', profilesResult.error);
    }

    // Create maps for quick lookup
    const usersById = new Map((usersResult.data || []).map(u => [u.id, u]));
    const profilesByUserId = new Map(
      (profilesResult.data || []).map(p => [p.user_id, p])
    );
    const servicesByUserId = new Map<string, any[]>();
    (servicesResult.data || []).forEach(service => {
      if (!servicesByUserId.has(service.user_id)) {
        servicesByUserId.set(service.user_id, []);
      }
      servicesByUserId.get(service.user_id)!.push(service);
    });

    // Transform the data to match the expected format
    const transformedContractors = businessProfiles
      .map(bp => {
        const user = usersById.get(bp.user_id);
        const profile = profilesByUserId.get(bp.user_id);
        const services = servicesByUserId.get(bp.user_id) || [];

        if (!user || !profile) {
          return null; // Skip if user or profile not found
        }

        return {
          id: user.id,
          email: user.email,
          name: `${profile.first_name} ${profile.last_name}`,
          companyName: bp.company_name,
          description: bp.description,
          location: bp.location || profile.location,
          avatarUrl: profile.avatar_url,
          logoUrl: bp.logo_url,
          bio: profile.bio,
          serviceCategories: bp.service_categories || [],
          averageRating: bp.average_rating || 0,
          reviewCount: bp.review_count || 0,
          isVerified: bp.is_verified,
          subscriptionTier: bp.subscription_tier,
          businessAddress: bp.business_address,
          serviceAreas: bp.service_areas || [],
          socialLinks: bp.social_links,
          verificationDate: bp.verification_date,
          services: services,
          createdAt: user.created_at,
          isPremium: true,
          isFeatured: true,
        };
      })
      .filter(
        (contractor): contractor is NonNullable<typeof contractor> =>
          contractor !== null
      );

    return NextResponse.json(
      {
        contractors: transformedContractors,
        total: transformedContractors.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Featured contractors API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
