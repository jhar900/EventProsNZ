import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: favorites, error: favoritesError } = await supabase
      .from('contractor_favorites')
      .select(
        `
        id,
        contractor_id,
        created_at,
        users!contractor_favorites_contractor_id_fkey(
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
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('Favorites error:', favoritesError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedFavorites =
      favorites?.map(favorite => ({
        id: favorite.id,
        contractorId: favorite.contractor_id,
        createdAt: favorite.created_at,
        contractor: {
          id: favorite.users.id,
          email: favorite.users.email,
          name: `${favorite.users.profiles.first_name} ${favorite.users.profiles.last_name}`,
          companyName: favorite.users.business_profiles.company_name,
          description: favorite.users.business_profiles.description,
          location:
            favorite.users.business_profiles.location ||
            favorite.users.profiles.location,
          avatarUrl: favorite.users.profiles.avatar_url,
          bio: favorite.users.profiles.bio,
          serviceCategories:
            favorite.users.business_profiles.service_categories || [],
          averageRating: favorite.users.business_profiles.average_rating || 0,
          reviewCount: favorite.users.business_profiles.review_count || 0,
          isVerified: favorite.users.business_profiles.is_verified,
          subscriptionTier: favorite.users.business_profiles.subscription_tier,
          businessAddress: favorite.users.business_profiles.business_address,
          serviceAreas: favorite.users.business_profiles.service_areas || [],
          socialLinks: favorite.users.business_profiles.social_links,
          verificationDate: favorite.users.business_profiles.verification_date,
          services: favorite.users.services || [],
          createdAt: favorite.users.created_at,
          isPremium: ['professional', 'enterprise'].includes(
            favorite.users.business_profiles.subscription_tier
          ),
        },
      })) || [];

    return NextResponse.json({
      favorites: transformedFavorites,
    });
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { contractor_id } = body;

    if (!contractor_id) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', contractor_id)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found or not verified' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('contractor_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('contractor_id', contractor_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Favorite check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing favorite' },
        { status: 500 }
      );
    }

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Contractor already in favorites' },
        { status: 409 }
      );
    }

    const { data: favorite, error: insertError } = await supabase
      .from('contractor_favorites')
      .insert({
        user_id: user.id,
        contractor_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Favorite insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add to favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favorite,
    });
  } catch (error) {
    console.error('Favorites POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const contractor_id = searchParams.get('contractor_id');

    if (!contractor_id) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('contractor_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('contractor_id', contractor_id);

    if (deleteError) {
      console.error('Favorite delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove from favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Favorites DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
