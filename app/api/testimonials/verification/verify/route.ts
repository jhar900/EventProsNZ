import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const verifyTestimonialSchema = z.object({
  testimonial_id: z.string().uuid(),
  verification_data: z.object({
    contractor_id: z.string().uuid(),
    inquiry_id: z.string().uuid(),
    inquiry_status: z.string(),
    created_at: z.string(),
  }),
});

// POST /api/testimonials/verification/verify - Verify testimonial
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
    const validatedData = verifyTestimonialSchema.parse(body);

    // Check if testimonial exists and user has permission to verify
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select('id, event_manager_id, contractor_id, inquiry_id, is_verified')
      .eq('id', validatedData.testimonial_id)
      .single();

    if (testimonialError) {
      if (testimonialError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Testimonial not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonial' },
        { status: 500 }
      );
    }

    // Check if user is the event manager who created the testimonial
    if (testimonial.event_manager_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only verify your own testimonials' },
        { status: 403 }
      );
    }

    // Check if testimonial is already verified
    if (testimonial.is_verified) {
      return NextResponse.json(
        { error: 'Testimonial is already verified' },
        { status: 409 }
      );
    }

    // Verify the inquiry data matches
    if (
      testimonial.contractor_id !==
      validatedData.verification_data.contractor_id
    ) {
      return NextResponse.json(
        { error: 'Verification data does not match testimonial' },
        { status: 400 }
      );
    }

    if (testimonial.inquiry_id !== validatedData.verification_data.inquiry_id) {
      return NextResponse.json(
        { error: 'Verification data does not match testimonial' },
        { status: 400 }
      );
    }

    // Update testimonial as verified
    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('testimonials')
      .update({ is_verified: true })
      .eq('id', validatedData.testimonial_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating testimonial:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonial: updatedTestimonial,
      success: true,
      message: 'Testimonial verified successfully',
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

    console.error(
      'Error in POST /api/testimonials/verification/verify:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
