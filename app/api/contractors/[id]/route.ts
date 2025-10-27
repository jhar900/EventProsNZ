import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

    const supabase = createClient();

    // Get contractor with profile data
    const { data: contractorData, error: contractorError } = await supabase
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
      `
      )
      .eq('id', contractorId)
      .single();

    if (contractorError || !contractorData) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const profile = Array.isArray(contractorData.profiles)
      ? contractorData.profiles[0]
      : contractorData.profiles;

    const contractor = {
      id: contractorData.id,
      email: contractorData.email,
      name: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : 'Unknown User',
      companyName: 'Test User Services', // Default for now
      description: '',
      location: profile?.location || null,
      avatarUrl: profile?.avatar_url || null,
      bio: profile?.bio || null,
      serviceCategories: [],
      averageRating: 0,
      reviewCount: 0,
      isVerified: false,
      subscriptionTier: 'essential',
      businessAddress: null,
      serviceAreas: [],
      socialLinks: null,
      verificationDate: null,
      services: [],
      portfolio: [],
      testimonials: [],
      createdAt: contractorData.created_at,
      isPremium: false,
      isFeatured: false,
    };

    return NextResponse.json({ contractor });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}
