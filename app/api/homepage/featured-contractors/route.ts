import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get featured contractors (Spotlight subscribers)
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
        specialties,
        years_experience,
        price_range,
        availability,
        created_at
      `
      )
      .eq('is_published', true)
      .eq('status', 'active')
      .eq('is_spotlight', true)
      .order('rating', { ascending: false })
      .limit(10);

    if (error) {
      // Log error for debugging
      console.error('Error fetching featured contractors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured contractors' },
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
          city: contractor.location?.city || 'Unknown',
          region: contractor.location?.region || 'Unknown',
        },
        rating: contractor.rating || 0,
        review_count: contractor.review_count || 0,
        is_verified: contractor.is_verified || false,
        is_spotlight: true,
        profile_image: contractor.profile_image,
        specialties: contractor.specialties || [],
        years_experience: contractor.years_experience || 0,
        price_range: contractor.price_range || 'Contact for pricing',
        availability: contractor.availability || 'Available',
      })) || [];

    return NextResponse.json({
      contractors: transformedContractors,
      total: transformedContractors.length,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Homepage featured contractors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
