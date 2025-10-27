import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Fetch contractor with all related data
    const { data: contractorData, error: contractorError } = await supabaseAdmin
      .from('users')
      .select(
        `
        id,
        email,
        name,
        role,
        is_verified,
        created_at,
        updated_at,
        profiles (
          first_name,
          last_name,
          phone,
          address,
          location,
          bio,
          avatar_url,
          timezone
        ),
        business_profiles (
          company_name,
          website,
          description,
          business_address,
          nzbn,
          service_areas,
          social_links
        ),
        services (
          id,
          service_type,
          description,
          price_range_min,
          price_range_max,
          availability,
          created_at,
          updated_at
        ),
        portfolio_items (
          id,
          title,
          description,
          image_url,
          video_url,
          event_date,
          created_at
        ),
        testimonials (
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
      .single();

    if (contractorError || !contractorData) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Transform the data to match our Contractor interface
    const profile = Array.isArray(contractorData.profiles)
      ? contractorData.profiles[0]
      : contractorData.profiles;

    const businessProfile = Array.isArray(contractorData.business_profiles)
      ? contractorData.business_profiles[0]
      : contractorData.business_profiles;

    // Calculate average rating and review count
    const testimonials = contractorData.testimonials || [];
    const ratings = testimonials
      .filter((t: any) => t.rating !== null)
      .map((t: any) => t.rating);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) /
          ratings.length
        : 0;

    const reviewCount = ratings.length;

    // Get service categories from services
    const serviceCategories = [
      ...new Set(
        (contractorData.services || []).map((s: any) => s.service_type)
      ),
    ];

    // Determine subscription tier (you might want to add this to your database)
    const subscriptionTier = 'essential'; // Default for now

    const contractor = {
      id: contractorData.id,
      email: contractorData.email,
      name: contractorData.name,
      companyName: businessProfile?.company_name || contractorData.name,
      description: businessProfile?.description || null,
      website: businessProfile?.website || null,
      location:
        profile?.location || businessProfile?.service_areas?.[0] || null,
      avatarUrl: profile?.avatar_url || null,
      bio: profile?.bio || null,
      phone: profile?.phone || null,
      address: profile?.address || null,
      timezone: profile?.timezone || 'Pacific/Auckland',
      serviceCategories,
      averageRating,
      reviewCount,
      isVerified: contractorData.is_verified || false,
      subscriptionTier,
      businessAddress: businessProfile?.business_address || null,
      nzbn: businessProfile?.nzbn || null,
      serviceAreas: businessProfile?.service_areas || [],
      socialLinks: businessProfile?.social_links || null,
      verificationDate: contractorData.is_verified
        ? contractorData.created_at
        : null,
      services: contractorData.services || [],
      portfolio: contractorData.portfolio_items || [],
      testimonials,
      createdAt: contractorData.created_at,
      updatedAt: contractorData.updated_at,
      isPremium: subscriptionTier !== 'essential',
      isFeatured: false, // You might want to add this to your database
    };

    return NextResponse.json({ contractor });
  } catch (error) {
    // Error handling
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}
