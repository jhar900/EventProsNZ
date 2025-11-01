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

    // First, get contractors with profiles
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
        )
      `,
        { count: 'exact' }
      )
      .eq('role', 'contractor');

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
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

    // Get business profiles for the contractors
    const contractorIds = contractors?.map(c => c.id) || [];
    let businessProfiles = [];

    if (contractorIds.length > 0) {
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .in('user_id', contractorIds);

      if (!businessError) {
        businessProfiles = businessData || [];
      }
    }

    // Transform the data to match the expected format
    const transformedContractors =
      contractors?.map(contractor => {
        const businessProfile = businessProfiles.find(
          bp => bp.user_id === contractor.id
        );

        // Handle profiles array (it should be an array from the join)
        const profile = Array.isArray(contractor.profiles)
          ? contractor.profiles[0]
          : contractor.profiles;

        return {
          id: contractor.id,
          email: contractor.email,
          name: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : 'Unknown User',
          companyName: businessProfile?.company_name || 'No Company Name',
          description: businessProfile?.description || '',
          location: businessProfile?.location || profile?.location,
          avatarUrl: profile?.avatar_url,
          logoUrl: businessProfile?.logo_url,
          bio: profile?.bio,
          serviceCategories: businessProfile?.service_categories || [],
          averageRating: businessProfile?.average_rating || 0,
          reviewCount: businessProfile?.review_count || 0,
          isVerified: businessProfile?.is_verified || false,
          subscriptionTier: businessProfile?.subscription_tier || 'essential',
          businessAddress: businessProfile?.location || profile?.location,
          serviceAreas: businessProfile?.service_categories || [],
          socialLinks: null,
          verificationDate: null,
          services: [], // Services will be fetched separately if needed
          createdAt: contractor.created_at,
          isPremium: ['professional', 'enterprise'].includes(
            businessProfile?.subscription_tier || 'essential'
          ),
        };
      }) || [];

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
