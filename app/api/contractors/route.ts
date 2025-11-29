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

    // Query business_profiles directly (more efficient) with joins
    // This ensures we only get published contractors and can filter/sort efficiently
    let query = supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        description,
        location,
        service_categories,
        average_rating,
        review_count,
        is_verified,
        subscription_tier,
        logo_url,
        users!inner(
          id,
          email,
          created_at,
          status,
          role,
          profiles!inner(
            first_name,
            last_name,
            avatar_url,
            location,
            bio
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('is_published', true)
      .eq('users.role', 'contractor')
      .neq('users.status', 'suspended');

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('users.created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('users.created_at', { ascending: true });
        break;
      case 'premium_first':
        // Sort by subscription tier (spotlight > showcase > essential), then rating
        query = query
          .order('subscription_tier', { ascending: false })
          .order('average_rating', { ascending: false });
        break;
      default:
        query = query.order('users.created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const {
      data: businessProfiles,
      error: businessProfilesError,
      count,
    } = await query;

    if (businessProfilesError) {
      console.error('Error fetching contractors:', businessProfilesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch contractors',
          details: businessProfilesError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedContractors =
      businessProfiles
        ?.map(bp => {
          const user = Array.isArray(bp.users) ? bp.users[0] : bp.users;
          const profile = Array.isArray(user?.profiles)
            ? user.profiles[0]
            : user?.profiles;

          if (!user || !profile) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name:
              `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
              'Unknown User',
            companyName: bp.company_name || 'No Company Name',
            description: bp.description || '',
            location: bp.location || profile.location,
            avatarUrl: profile.avatar_url,
            logoUrl: bp.logo_url,
            bio: profile.bio,
            serviceCategories: bp.service_categories || [],
            averageRating: bp.average_rating || 0,
            reviewCount: bp.review_count || 0,
            isVerified: bp.is_verified || false,
            subscriptionTier: bp.subscription_tier || 'essential',
            businessAddress: bp.location || profile.location,
            serviceAreas: bp.service_categories || [],
            socialLinks: null,
            verificationDate: null,
            services: [], // Services will be fetched separately if needed
            createdAt: user.created_at,
            isPremium: ['showcase', 'spotlight'].includes(
              bp.subscription_tier || 'essential'
            ),
          };
        })
        .filter(
          (contractor): contractor is NonNullable<typeof contractor> =>
            contractor !== null
        ) || [];

    // Use the count from the query if available, otherwise use transformed length
    const totalCount = count ?? transformedContractors.length;

    return NextResponse.json(
      {
        contractors: transformedContractors,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=15',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
