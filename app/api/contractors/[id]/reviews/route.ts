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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rating = searchParams.get('rating');

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

    // Build query for reviews
    let query = supabase
      .from('contractor_testimonials')
      .select(
        `
        *,
        event_managers:event_manager_id(
          profiles(first_name, last_name)
        )
      `,
        { count: 'exact' }
      )
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply rating filter if provided
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query = query.eq('rating', ratingNum);
      }
    }

    const { data: reviews, error: reviewsError, count } = await query;

    if (reviewsError) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Calculate average rating
    const { data: ratingStats } = await supabase
      .from('contractor_testimonials')
      .select('rating')
      .eq('contractor_id', contractorId);

    const averageRating =
      ratingStats?.length > 0
        ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length
        : 0;

    // Get rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      rating: star,
      count: ratingStats?.filter(r => r.rating === star).length || 0,
    }));

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
