import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const summarySchema = z.object({
  contractor_id: z.string().uuid(),
});

// GET /api/testimonials/display/summary - Get rating summary
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = summarySchema.parse(queryParams);

    // Get rating summary
    const { data: ratingSummary, error: ratingError } = await supabase
      .from('testimonial_ratings')
      .select('*')
      .eq('contractor_id', validatedParams.contractor_id)
      .single();

    if (ratingError) {
      if (ratingError.code === 'PGRST116') {
        // No ratings yet, return empty summary
        return NextResponse.json({
          rating_summary: {
            contractor_id: validatedParams.contractor_id,
            average_rating: 0,
            total_reviews: 0,
            rating_breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            last_updated: null,
          },
        });
      }
      console.error('Error fetching rating summary:', ratingError);
      return NextResponse.json(
        { error: 'Failed to fetch rating summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rating_summary: ratingSummary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in GET /api/testimonials/display/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
