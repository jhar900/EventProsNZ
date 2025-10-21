import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateRatingSchema = z.object({
  contractor_id: z.string().uuid(),
});

// POST /api/testimonials/rating/update - Update rating aggregation
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRatingSchema.parse(body);

    // Call the database function to update ratings
    const { data: ratingSummary, error: ratingError } = await supabase.rpc(
      'update_testimonial_ratings',
      {
        contractor_uuid: validatedData.contractor_id,
      }
    );

    if (ratingError) {
      console.error('Error updating testimonial ratings:', ratingError);
      return NextResponse.json(
        { error: 'Failed to update rating summary' },
        { status: 500 }
      );
    }

    // Get the updated rating summary
    const { data: updatedRating, error: fetchError } = await supabase
      .from('testimonial_ratings')
      .select('*')
      .eq('contractor_id', validatedData.contractor_id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated rating summary:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated rating summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rating_summary: updatedRating,
      success: true,
      message: 'Rating summary updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/testimonials/rating/update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
