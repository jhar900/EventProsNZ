import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkSuspensionAndBlock } from '@/lib/middleware/suspension-middleware';
import { z } from 'zod';

// Validation schemas
const createTestimonialSchema = z.object({
  contractor_id: z.string().uuid(),
  inquiry_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(10).max(2000),
});

// POST /api/testimonials/create - Create testimonial with enhanced validation
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

    // Check suspension status
    const suspensionResponse = await checkSuspensionAndBlock(
      request,
      user.id,
      supabase
    );
    if (suspensionResponse) {
      return suspensionResponse;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTestimonialSchema.parse(body);

    // Verify user is event manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can create testimonials' },
        { status: 403 }
      );
    }

    // Enhanced eligibility verification
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(
        `
        id, 
        status, 
        contractor_id,
        event_manager_id,
        created_at
      `
      )
      .eq('id', validatedData.inquiry_id)
      .eq('event_manager_id', user.id)
      .eq('contractor_id', validatedData.contractor_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        {
          error:
            'You can only create testimonials for contractors you have inquired with',
        },
        { status: 403 }
      );
    }

    // Check if inquiry is in a valid state for testimonial
    if (inquiry.status === 'sent') {
      return NextResponse.json(
        {
          error:
            'Cannot create testimonial for inquiries that have not been responded to',
        },
        { status: 403 }
      );
    }

    // Check if testimonial already exists for this inquiry
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('testimonials')
      .select('id, is_approved')
      .eq('inquiry_id', validatedData.inquiry_id)
      .single();

    if (existingTestimonial) {
      return NextResponse.json(
        {
          error: 'Testimonial already exists for this inquiry',
          testimonial_id: existingTestimonial.id,
        },
        { status: 409 }
      );
    }

    // Create testimonial with enhanced data
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .insert({
        contractor_id: validatedData.contractor_id,
        event_manager_id: user.id,
        inquiry_id: validatedData.inquiry_id,
        rating: validatedData.rating,
        review_text: validatedData.review_text,
        is_verified: true, // Verified because it's linked to an inquiry
        is_approved: false, // Requires moderation
        is_public: false, // Not public until approved
      })
      .select(
        `
        *,
        contractor:users!testimonials_contractor_id_fkey(id, first_name, last_name, company_name),
        inquiry:inquiries(id, subject, status)
      `
      )
      .single();

    if (testimonialError) {
      console.error('Error creating testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to create testimonial' },
        { status: 500 }
      );
    }

    // Create moderation record
    const { error: moderationError } = await supabase
      .from('testimonial_moderation')
      .insert({
        testimonial_id: testimonial.id,
        moderator_id: user.id, // Self-moderation for initial creation
        moderation_status: 'pending',
        moderation_notes: 'Testimonial created, awaiting admin review',
      });

    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        testimonial,
        success: true,
        message: 'Testimonial created successfully and submitted for review',
      },
      { status: 201 }
    );
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

    console.error('Error in POST /api/testimonials/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
