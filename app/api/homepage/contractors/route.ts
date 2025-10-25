import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get published contractors for map display
    const { data: contractors, error } = await supabase
      .from('contractors')
      .select(
        `
        id,
        name,
        business_name,
        service_category,
        location,
        rating,
        review_count,
        is_verified,
        is_premium,
        profile_image,
        created_at
      `
      )
      .eq('is_published', true)
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .limit(50);

    if (error) {
      // Log error for debugging
      console.error('Error fetching contractors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedContractors =
      contractors?.map(contractor => ({
        id: contractor.id,
        name: contractor.name,
        business_name: contractor.business_name,
        service_category: contractor.service_category,
        location: {
          latitude: contractor.location?.latitude || 0,
          longitude: contractor.location?.longitude || 0,
          city: contractor.location?.city || 'Unknown',
          region: contractor.location?.region || 'Unknown',
        },
        rating: contractor.rating || 0,
        review_count: contractor.review_count || 0,
        is_verified: contractor.is_verified || false,
        is_premium: contractor.is_premium || false,
        profile_image: contractor.profile_image,
      })) || [];

    return NextResponse.json({
      contractors: transformedContractors,
      total: transformedContractors.length,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Homepage contractors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
