import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createResponseSchema = z.object({
  response_text: z.string().min(10).max(2000),
});

const updateResponseSchema = z.object({
  response_text: z.string().min(10).max(2000).optional(),
  is_approved: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

// POST /api/testimonials/[id]/response - Create contractor response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = createResponseSchema.parse(body);

    // Check if testimonial exists and user is the contractor
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select('id, contractor_id, is_approved')
      .eq('id', params.id)
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

    // Check if user is the contractor
    if (testimonial.contractor_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the contractor can respond to their testimonials' },
        { status: 403 }
      );
    }

    // Check if testimonial is approved (only approved testimonials can have responses)
    if (!testimonial.is_approved) {
      return NextResponse.json(
        { error: 'Cannot respond to unapproved testimonials' },
        { status: 403 }
      );
    }

    // Check if response already exists
    const { data: existingResponse, error: existingError } = await supabase
      .from('testimonial_responses')
      .select('id')
      .eq('testimonial_id', params.id)
      .single();

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Response already exists for this testimonial' },
        { status: 409 }
      );
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from('testimonial_responses')
      .insert({
        testimonial_id: params.id,
        contractor_id: user.id,
        response_text: validatedData.response_text,
        is_approved: false, // Requires moderation
        is_public: false, // Not public until approved
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error creating response:', responseError);
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        response,
        success: true,
        message: 'Response created successfully and submitted for review',
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

    console.error('Error in POST /api/testimonials/[id]/response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/testimonials/[id]/response - Get testimonial response
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get response
    const { data: response, error: responseError } = await supabase
      .from('testimonial_responses')
      .select(
        `
        *,
        contractor:users!testimonial_responses_contractor_id_fkey(
          id, 
          first_name, 
          last_name, 
          profile_photo_url
        )
      `
      )
      .eq('testimonial_id', params.id)
      .single();

    if (responseError) {
      if (responseError.code === 'PGRST116') {
        return NextResponse.json({ response: null });
      }
      console.error('Error fetching response:', responseError);
      return NextResponse.json(
        { error: 'Failed to fetch response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in GET /api/testimonials/[id]/response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
