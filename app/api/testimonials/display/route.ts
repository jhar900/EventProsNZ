import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const displaySchema = z.object({
  contractor_id: z.string().uuid(),
  is_public: z
    .string()
    .optional()
    .transform(val => val === 'true'),
});

// GET /api/testimonials/display - Get testimonials for display
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
    const validatedParams = displaySchema.parse(queryParams);

    // Get testimonials for the contractor
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select(
        `
        id,
        rating,
        review_text,
        is_verified,
        is_approved,
        is_public,
        created_at,
        event_manager:users!testimonials_event_manager_id_fkey(
          id, 
          first_name, 
          last_name, 
          profile_photo_url
        ),
        inquiry:inquiries(id, subject, created_at),
        response:testimonial_responses(
          id,
          response_text,
          is_approved,
          is_public,
          created_at
        )
      `
      )
      .eq('contractor_id', validatedParams.contractor_id)
      .eq('is_approved', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    // Get rating summary
    const { data: ratingSummary, error: ratingError } = await supabase
      .from('testimonial_ratings')
      .select('*')
      .eq('contractor_id', validatedParams.contractor_id)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') {
      console.error('Error fetching rating summary:', ratingError);
      return NextResponse.json(
        { error: 'Failed to fetch rating summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonials: testimonials || [],
      rating_summary: ratingSummary || {
        contractor_id: validatedParams.contractor_id,
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      },
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

    console.error('Error in GET /api/testimonials/display:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
