import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get contractor testimonials/reviews
    const {
      data: reviews,
      error: reviewsError,
      count,
    } = await supabase
      .from('contractor_testimonials')
      .select(
        `
        id,
        client_name,
        rating,
        comment,
        event_title,
        event_date,
        is_verified,
        created_at
      `
      )
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reviewsError) {
      console.error('Contractor reviews fetch error:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch contractor reviews' },
        { status: 500 }
      );
    }

    // Calculate average rating
    const { data: ratingData, error: ratingError } = await supabase
      .from('contractor_testimonials')
      .select('rating')
      .eq('contractor_id', contractorId)
      .not('rating', 'is', null);

    if (ratingError) {
      console.error('Rating calculation error:', ratingError);
    }

    const averageRating =
      ratingData?.length > 0
        ? ratingData.reduce((sum, review) => sum + (review.rating || 0), 0) /
          ratingData.length
        : 0;

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Contractor reviews API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
