import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get contractor details with all related data
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        created_at,
        updated_at,
        profiles!inner(
          first_name,
          last_name,
          phone,
          address,
          avatar_url,
          location,
          bio,
          timezone
        ),
        business_profiles!inner(
          company_name,
          description,
          website,
          location,
          service_categories,
          average_rating,
          review_count,
          is_verified,
          subscription_tier,
          business_address,
          nzbn,
          service_areas,
          social_links,
          verification_date
        ),
        services(
          id,
          service_type,
          description,
          price_range_min,
          price_range_max,
          availability,
          created_at
        ),
        portfolio(
          id,
          title,
          description,
          image_url,
          video_url,
          event_date,
          created_at
        ),
        contractor_testimonials(
          id,
          client_name,
          rating,
          comment,
          event_title,
          event_date,
          is_verified,
          created_at
        )
      `
      )
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError) {
      if (contractorError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch contractor details' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedContractor = {
      id: contractor.id,
      email: contractor.email,
      name: `${contractor.profiles.first_name} ${contractor.profiles.last_name}`,
      companyName: contractor.business_profiles.company_name,
      description: contractor.business_profiles.description,
      website: contractor.business_profiles.website,
      location:
        contractor.business_profiles.location || contractor.profiles.location,
      avatarUrl: contractor.profiles.avatar_url,
      bio: contractor.profiles.bio,
      phone: contractor.profiles.phone,
      address: contractor.profiles.address,
      timezone: contractor.profiles.timezone,
      serviceCategories: contractor.business_profiles.service_categories || [],
      averageRating: contractor.business_profiles.average_rating || 0,
      reviewCount: contractor.business_profiles.review_count || 0,
      isVerified: contractor.business_profiles.is_verified,
      subscriptionTier: contractor.business_profiles.subscription_tier,
      businessAddress: contractor.business_profiles.business_address,
      nzbn: contractor.business_profiles.nzbn,
      serviceAreas: contractor.business_profiles.service_areas || [],
      socialLinks: contractor.business_profiles.social_links,
      verificationDate: contractor.business_profiles.verification_date,
      services: contractor.services || [],
      portfolio: contractor.portfolio || [],
      testimonials: contractor.contractor_testimonials || [],
      createdAt: contractor.created_at,
      updatedAt: contractor.updated_at,
      isPremium: ['professional', 'enterprise'].includes(
        contractor.business_profiles.subscription_tier
      ),
    };

    return NextResponse.json({
      contractor: transformedContractor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
